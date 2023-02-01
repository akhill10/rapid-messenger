package chat

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/pawanakhil/rapid-messenger/pkg/common"
	"gopkg.in/olahol/melody.v1"
)

func (r *HttpServer) StartChat(c *gin.Context) {
	uid := c.Query("uid")
	userID, err := strconv.ParseUint(uid, 10, 64)
	if err != nil {
		response(c, http.StatusBadRequest, common.ErrInvalidParam)
		return
	}
	accessToken := c.Query("access_token")
	authResult, err := common.Auth(&common.AuthPayload{
		AccessToken: accessToken,
	})
	if err != nil {
		response(c, http.StatusUnauthorized, common.ErrUnauthorized)
		return
	}
	if authResult.Expired {
		r.logger.Error(common.ErrTokenExpired)
		response(c, http.StatusUnauthorized, common.ErrTokenExpired)
	}
	channelID := authResult.ChannelID
	exist, err := r.userSvc.IsChannelUserExist(c.Request.Context(), channelID, userID)
	if err != nil {
		r.logger.Error(err)
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	if !exist {
		response(c, http.StatusNotFound, ErrChannelOrUserNotFound)
		return
	}

	r.mc.HandleRequest(c.Writer, c.Request)
}

func (r *HttpServer) GetChannelUsers(c *gin.Context) {
	channelID, ok := c.Request.Context().Value(common.ChannelKey).(uint64)
	if !ok {
		response(c, http.StatusUnauthorized, common.ErrUnauthorized)
		return
	}
	userIDs, err := r.userSvc.GetChannelUserIDs(c.Request.Context(), channelID)
	if err != nil {
		r.logger.Error(err)
		if err == ErrChannelNotFound {
			response(c, http.StatusNotFound, ErrChannelNotFound)
			return
		}
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	userIDsPresenter := []string{}
	for _, userID := range userIDs {
		userIDsPresenter = append(userIDsPresenter, strconv.FormatUint(userID, 10))
	}
	c.JSON(http.StatusOK, &UserIDsPresenter{
		UserIDs: userIDsPresenter,
	})
}

func (r *HttpServer) GetOnlineUsers(c *gin.Context) {
	channelID, ok := c.Request.Context().Value(common.ChannelKey).(uint64)
	if !ok {
		response(c, http.StatusUnauthorized, common.ErrUnauthorized)
		return
	}
	userIDs, err := r.userSvc.GetOnlineUserIDs(c.Request.Context(), channelID)
	if err != nil {
		if err == ErrChannelNotFound {
			response(c, http.StatusNotFound, ErrChannelNotFound)
			return
		}
		r.logger.Error(err)
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	userIDsPresenter := []string{}
	for _, userID := range userIDs {
		userIDsPresenter = append(userIDsPresenter, strconv.FormatUint(userID, 10))
	}
	c.JSON(http.StatusOK, &UserIDsPresenter{
		UserIDs: userIDsPresenter,
	})
}

func (r *HttpServer) ListMessages(c *gin.Context) {
	channelID, ok := c.Request.Context().Value(common.ChannelKey).(uint64)
	if !ok {
		response(c, http.StatusUnauthorized, common.ErrUnauthorized)
		return
	}
	msgs, err := r.msgSvc.ListMessages(c.Request.Context(), channelID)
	if err != nil {
		r.logger.Error(err)
		if err == ErrChannelNotFound {
			response(c, http.StatusNotFound, ErrChannelNotFound)
			return
		}
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	msgsPresenter := []MessagePresenter{}
	for _, msg := range msgs {
		msgsPresenter = append(msgsPresenter, *msg.ToPresenter())
	}
	c.JSON(http.StatusOK, &MessagesPresenter{
		Messages: msgsPresenter,
	})
}

func (r *HttpServer) DeleteChannel(c *gin.Context) {
	channelID, ok := c.Request.Context().Value(common.ChannelKey).(uint64)
	if !ok {
		response(c, http.StatusUnauthorized, common.ErrUnauthorized)
		return
	}
	uid := c.Query("delby")
	userID, err := strconv.ParseUint(uid, 10, 64)
	if err != nil {
		response(c, http.StatusBadRequest, common.ErrInvalidParam)
		return
	}

	exist, err := r.userSvc.IsChannelUserExist(c.Request.Context(), channelID, userID)
	if err != nil {
		r.logger.Error(err)
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	if !exist {
		response(c, http.StatusBadRequest, ErrChannelOrUserNotFound)
		return
	}

	err = r.msgSvc.BroadcastActionMessage(c.Request.Context(), channelID, userID, LeavedMessage)
	if err != nil {
		r.logger.Error(err)
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	err = r.chanSvc.DeleteChannel(c.Request.Context(), channelID)
	if err != nil {
		r.logger.Error(err)
		response(c, http.StatusInternalServerError, common.ErrServer)
		return
	}
	c.JSON(http.StatusNoContent, common.SuccessMessage{
		Message: "ok",
	})
}

func (r *HttpServer) HandleChatOnConnect(sess *melody.Session) {
	userID, err := strconv.ParseUint(sess.Request.URL.Query().Get("uid"), 10, 64)
	if err != nil {
		r.logger.Error(err)
		return
	}
	accessToken := sess.Request.URL.Query().Get("access_token")
	authResult, err := common.Auth(&common.AuthPayload{
		AccessToken: accessToken,
	})
	if err != nil {
		r.logger.Error(err)
	}
	if authResult.Expired {
		r.logger.Error(common.ErrTokenExpired)
	}
	channelID := authResult.ChannelID
	err = r.initializeChatSession(sess, channelID, userID)
	if err != nil {
		r.logger.Error(err)
		return
	}
	if err := r.msgSvc.BroadcastConnectMessage(context.Background(), channelID, userID); err != nil {
		r.logger.Error(err)
		return
	}
}

func (r *HttpServer) initializeChatSession(sess *melody.Session, channelID, userID uint64) error {
	ctx := context.Background()
	if err := r.userSvc.AddOnlineUser(ctx, channelID, userID); err != nil {
		return err
	}
	sess.Set(sessCidKey, channelID)
	return nil
}

func (r *HttpServer) HandleChatOnMessage(sess *melody.Session, data []byte) {
	msgPresenter, err := DecodeToMessagePresenter(data)
	if err != nil {
		r.logger.Error(err)
		return
	}
	msg, err := msgPresenter.ToMessage(sess.Request.URL.Query().Get("access_token"))
	if err != nil {
		r.logger.Error(err)
		return
	}
	switch msg.Event {
	case EventText:
		if err := r.msgSvc.BroadcastTextMessage(context.Background(), msg.ChannelID, msg.UserID, msg.Payload); err != nil {
			r.logger.Error(err)
		}
	case EventAction:
		if err := r.msgSvc.BroadcastActionMessage(context.Background(), msg.ChannelID, msg.UserID, Action(msg.Payload)); err != nil {
			r.logger.Error(err)
		}
	case EventSeen:
		messageID, err := strconv.ParseUint(msg.Payload, 10, 64)
		if err != nil {
			r.logger.Error(err)
			return
		}
		if err := r.msgSvc.MarkMessageSeen(context.Background(), msg.ChannelID, msg.UserID, messageID); err != nil {
			r.logger.Error(err)
		}
	case EventFile:
		if err := r.msgSvc.BroadcastFileMessage(context.Background(), msg.ChannelID, msg.UserID, msg.Payload); err != nil {
			r.logger.Error(err)
		}
	default:
		r.logger.Errorf("invailid event type: %v", msg.Event)
	}
}

func (r *HttpServer) HandleChatOnClose(sess *melody.Session, i int, s string) error {
	userID, err := strconv.ParseUint(sess.Request.URL.Query().Get("uid"), 10, 64)
	if err != nil {
		r.logger.Error(err)
		return err
	}
	accessToken := sess.Request.URL.Query().Get("access_token")
	authResult, err := common.Auth(&common.AuthPayload{
		AccessToken: accessToken,
	})
	if err != nil {
		r.logger.Error(err)
		return err
	}
	if authResult.Expired {
		r.logger.Error(common.ErrTokenExpired)
		return common.ErrTokenExpired
	}
	channelID := authResult.ChannelID
	err = r.userSvc.DeleteOnlineUser(context.Background(), channelID, userID)
	if err != nil {
		r.logger.Error(err)
		return err
	}
	return r.msgSvc.BroadcastActionMessage(context.Background(), channelID, userID, OfflineMessage)
}
