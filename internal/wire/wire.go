//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.
package wire

import (
	"github.com/google/wire"
	"github.com/pawanakhil/rapid-messenger/pkg/chat"
	"github.com/pawanakhil/rapid-messenger/pkg/common"
	"github.com/pawanakhil/rapid-messenger/pkg/config"
	"github.com/pawanakhil/rapid-messenger/pkg/infra"
	"github.com/pawanakhil/rapid-messenger/pkg/match"
	"github.com/pawanakhil/rapid-messenger/pkg/uploader"
	"github.com/pawanakhil/rapid-messenger/pkg/user"
	"github.com/pawanakhil/rapid-messenger/pkg/web"
)

func InitializeWebServer(name string) (*common.Server, error) {
	wire.Build(
		config.NewConfig,
		common.NewObservabilityInjector,
		common.NewHttpLogrus,
		web.NewGinServer,
		web.NewHttpServer,
		web.NewRouter,
		web.NewInfraCloser,
		common.NewServer,
	)
	return &common.Server{}, nil
}

func InitializeMatchServer(name string) (*common.Server, error) {
	wire.Build(
		config.NewConfig,
		common.NewObservabilityInjector,
		common.NewHttpLogrus,

		infra.NewRedisClient,
		infra.NewRedisCache,

		match.NewChatClientConn,
		match.NewUserClientConn,

		match.NewChannelRepo,
		match.NewUserRepo,
		match.NewMatchingRepo,

		match.NewMatchSubscriber,

		match.NewUserService,
		match.NewMatchingService,

		match.NewMelodyMatchConn,

		match.NewGinServer,
		match.NewHttpServer,
		match.NewRouter,
		match.NewInfraCloser,
		common.NewServer,
	)
	return &common.Server{}, nil
}

func InitializeChatServer(name string) (*common.Server, error) {
	wire.Build(
		config.NewConfig,
		common.NewObservabilityInjector,
		common.NewHttpLogrus,
		common.NewGrpcLogrus,

		infra.NewRedisClient,
		infra.NewRedisCache,

		chat.NewUserRepo,
		chat.NewMessageRepo,
		chat.NewChannelRepo,

		chat.NewMessageSubscriber,

		common.NewSonyFlake,

		chat.NewUserService,
		chat.NewMessageService,
		chat.NewChannelService,

		chat.NewMelodyChatConn,

		chat.NewGinServer,
		chat.NewHttpServer,
		chat.NewGrpcServer,
		chat.NewRouter,
		chat.NewInfraCloser,
		common.NewServer,
	)
	return &common.Server{}, nil
}

func InitializeUploaderServer(name string) (*common.Server, error) {
	wire.Build(
		config.NewConfig,
		common.NewObservabilityInjector,
		common.NewHttpLogrus,
		uploader.NewGinServer,
		uploader.NewHttpServer,
		uploader.NewRouter,
		uploader.NewInfraCloser,
		common.NewServer,
	)
	return &common.Server{}, nil
}

func InitializeUserServer(name string) (*common.Server, error) {
	wire.Build(
		config.NewConfig,
		common.NewObservabilityInjector,
		common.NewHttpLogrus,
		common.NewGrpcLogrus,

		infra.NewRedisClient,
		infra.NewRedisCache,

		user.NewUserRepo,

		common.NewSonyFlake,

		user.NewUserService,

		user.NewGinServer,
		user.NewHttpServer,
		user.NewGrpcServer,
		user.NewRouter,
		user.NewInfraCloser,
		common.NewServer,
	)
	return &common.Server{}, nil
}
