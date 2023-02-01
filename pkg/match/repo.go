package match

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/go-kit/kit/endpoint"
	chatpb "github.com/pawanakhil/rapid-messenger/internal/proto_gen/chat"
	userpb "github.com/pawanakhil/rapid-messenger/internal/proto_gen/user"
	"github.com/pawanakhil/rapid-messenger/pkg/infra"
	"github.com/pawanakhil/rapid-messenger/pkg/transport"
)

var (
	matchPubSubTopic = "rc:match:pubsub"
	userWaitList     = "rc:userwait"
)

var (
	ErrUserNotFound = errors.New("error user not found")
)

type ChannelRepo interface {
	CreateChannel(ctx context.Context) (uint64, error)
}

type UserRepo interface {
	GetUserByID(ctx context.Context, userID uint64) (*User, error)
	AddUserToChannel(ctx context.Context, channelID uint64, userID uint64) error
}

type MatchingRepo interface {
	PopOrPushWaitList(ctx context.Context, userID uint64) (bool, uint64, error)
	PublishMatchResult(ctx context.Context, result *MatchResult) error
	RemoveFromWaitList(ctx context.Context, userID uint64) error
}

type ChannelRepoImpl struct {
	createChannel endpoint.Endpoint
}

func NewChannelRepo(chatConn *ChatClientConn) ChannelRepo {
	return &ChannelRepoImpl{
		createChannel: transport.NewGrpcEndpoint(
			chatConn.Conn,
			"chat",
			"chat.ChannelService",
			"CreateChannel",
			&chatpb.CreateChannelResponse{},
		),
	}
}

func (repo *ChannelRepoImpl) CreateChannel(ctx context.Context) (uint64, error) {
	res, err := repo.createChannel(ctx, &chatpb.CreateChannelRequest{})
	if err != nil {
		return 0, err
	}
	return res.(*chatpb.CreateChannelResponse).ChannelId, nil
}

type UserRepoImpl struct {
	getUser          endpoint.Endpoint
	addUserToChannel endpoint.Endpoint
}

func NewUserRepo(userConn *UserClientConn, chatConn *ChatClientConn) UserRepo {
	return &UserRepoImpl{
		getUser: transport.NewGrpcEndpoint(
			userConn.Conn,
			"user",
			"user.UserService",
			"GetUser",
			&userpb.GetUserResponse{},
		),
		addUserToChannel: transport.NewGrpcEndpoint(
			chatConn.Conn,
			"chat",
			"chat.UserService",
			"AddUserToChannel",
			&chatpb.AddUserResponse{},
		),
	}
}

func (repo *UserRepoImpl) GetUserByID(ctx context.Context, userID uint64) (*User, error) {
	res, err := repo.getUser(ctx, &userpb.GetUserRequest{
		UserId: userID,
	})
	if err != nil {
		return nil, err
	}
	pbUser := res.(*userpb.GetUserResponse)
	return &User{
		ID:   pbUser.User.Id,
		Name: pbUser.User.Name,
	}, nil
}
func (repo *UserRepoImpl) AddUserToChannel(ctx context.Context, channelID uint64, userID uint64) error {
	_, err := repo.addUserToChannel(ctx, &chatpb.AddUserRequest{
		ChannelId: channelID,
		UserId:    userID,
	})
	if err != nil {
		return err
	}
	return nil
}

type MatchingRepoImpl struct {
	r infra.RedisCache
}

func NewMatchingRepo(r infra.RedisCache) MatchingRepo {
	return &MatchingRepoImpl{r}
}
func (repo *MatchingRepoImpl) PopOrPushWaitList(ctx context.Context, userID uint64) (bool, uint64, error) {
	match, peerIDStr, err := repo.r.ZPopMinOrAddOne(ctx, userWaitList, float64(time.Now().Unix()), userID)
	if err != nil {
		return false, 0, err
	}
	if !match {
		return false, 0, nil
	}
	peerID, err := strconv.ParseUint(peerIDStr, 10, 64)
	if err != nil {
		return false, 0, err
	}
	return true, peerID, nil
}
func (repo *MatchingRepoImpl) RemoveFromWaitList(ctx context.Context, userID uint64) error {
	return repo.r.ZRemOne(ctx, userWaitList, userID)
}
func (repo *MatchingRepoImpl) PublishMatchResult(ctx context.Context, result *MatchResult) error {
	return repo.r.Publish(ctx, matchPubSubTopic, result.Encode())
}
