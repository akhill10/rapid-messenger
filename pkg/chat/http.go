package chat

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pawanakhil/rapid-messenger/pkg/common"
	"github.com/pawanakhil/rapid-messenger/pkg/config"
	metrics "github.com/slok/go-http-metrics/metrics/prometheus"
	prommiddleware "github.com/slok/go-http-metrics/middleware"
	ginmiddleware "github.com/slok/go-http-metrics/middleware/gin"
	"gopkg.in/olahol/melody.v1"
)

var (
	sessCidKey = "sesscid"

	MelodyChat MelodyChatConn
)

type MelodyChatConn struct {
	*melody.Melody
}

type HttpServer struct {
	name          string
	logger        common.HttpLogrus
	svr           *gin.Engine
	mc            MelodyChatConn
	httpPort      string
	httpServer    *http.Server
	msgSubscriber MessageSubscriber
	userSvc       UserService
	msgSvc        MessageService
	chanSvc       ChannelService
}

func NewMelodyChatConn(config *config.Config) MelodyChatConn {
	m := melody.New()
	m.Config.MaxMessageSize = config.Chat.Message.MaxSizeByte
	MelodyChat = MelodyChatConn{
		m,
	}
	return MelodyChat
}

func NewGinServer(name string, logger common.HttpLogrus, config *config.Config) *gin.Engine {
	common.InitLogging()

	svr := gin.New()
	svr.Use(gin.Recovery())
	svr.Use(common.CorsMiddleware())
	svr.Use(common.LoggingMiddleware(logger))
	svr.Use(common.MaxAllowed(config.Chat.Http.Server.MaxConn))

	mdlw := prommiddleware.New(prommiddleware.Config{
		Recorder: metrics.NewRecorder(metrics.Config{
			Prefix: name,
		}),
	})
	svr.Use(ginmiddleware.Handler("", mdlw))
	return svr
}

func NewHttpServer(name string, logger common.HttpLogrus, config *config.Config, svr *gin.Engine, mc MelodyChatConn, msgSubscriber MessageSubscriber, userSvc UserService, msgSvc MessageService, chanSvc ChannelService) common.HttpServer {
	initJWT(config)

	return &HttpServer{
		name:          name,
		logger:        logger,
		svr:           svr,
		mc:            mc,
		httpPort:      config.Chat.Http.Server.Port,
		msgSubscriber: msgSubscriber,
		userSvc:       userSvc,
		msgSvc:        msgSvc,
		chanSvc:       chanSvc,
	}
}

func initJWT(config *config.Config) {
	common.JwtSecret = config.Chat.JWT.Secret
}

func (r *HttpServer) RegisterRoutes() {
	r.svr.GET("/api/chat", r.StartChat)

	chanUsersGroup := r.svr.Group("/api/chanusers")
	chanUsersGroup.Use(common.JWTAuth())
	{
		chanUsersGroup.GET("", r.GetChannelUsers)
		chanUsersGroup.GET("/online", r.GetOnlineUsers)
	}
	channelGroup := r.svr.Group("/api/channel")
	channelGroup.Use(common.JWTAuth())
	{
		channelGroup.GET("/messages", r.ListMessages)
		channelGroup.DELETE("", r.DeleteChannel)
	}

	r.mc.HandleMessage(r.HandleChatOnMessage)
	r.mc.HandleConnect(r.HandleChatOnConnect)
	r.mc.HandleClose(r.HandleChatOnClose)
}

func (r *HttpServer) Run() {
	go func() {
		addr := ":" + r.httpPort
		r.httpServer = &http.Server{
			Addr:    addr,
			Handler: common.NewOtelHttpHandler(r.svr, r.name+"_http"),
		}
		r.logger.Infoln("http server listening on ", addr)
		err := r.httpServer.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			r.logger.Fatal(err)
		}
	}()
	go func() {
		err := r.msgSubscriber.Subscribe()
		if err != nil {
			r.logger.Fatal(err)
		}
	}()
}
func (r *HttpServer) GracefulStop(ctx context.Context) error {
	r.msgSubscriber.Close()
	return r.httpServer.Shutdown(ctx)
}

func response(c *gin.Context, httpCode int, err error) {
	message := err.Error()
	c.JSON(httpCode, common.ErrResponse{
		Message: message,
	})
}
