package chat

import (
	"net"

	"google.golang.org/grpc"

	grpc_prometheus "github.com/grpc-ecosystem/go-grpc-prometheus"
	chatpb "github.com/pawanakhil/rapid-messenger/internal/proto_gen/chat"
	"github.com/pawanakhil/rapid-messenger/pkg/common"
	"github.com/pawanakhil/rapid-messenger/pkg/config"
	"github.com/pawanakhil/rapid-messenger/pkg/transport"
)

type GrpcServer struct {
	grpcPort string
	logger   common.GrpcLogrus
	s        *grpc.Server
	userSvc  UserService
	chanSvc  ChannelService
}

func NewGrpcServer(logger common.GrpcLogrus, config *config.Config, userSvc UserService, chanSvc ChannelService) common.GrpcServer {
	srv := &GrpcServer{
		grpcPort: config.Chat.Grpc.Server.Port,
		logger:   logger,
		userSvc:  userSvc,
		chanSvc:  chanSvc,
	}
	srv.s = transport.InitializeGrpcServer(srv.logger)
	return srv
}

func (srv *GrpcServer) Register() {
	chatpb.RegisterChannelServiceServer(srv.s, srv)
	chatpb.RegisterUserServiceServer(srv.s, srv)
	grpc_prometheus.Register(srv.s)
}

func (srv *GrpcServer) Run() {
	go func() {
		addr := "0.0.0.0:" + srv.grpcPort
		srv.logger.Infoln("grpc server listening on  ", addr)
		lis, err := net.Listen("tcp", addr)
		if err != nil {
			srv.logger.Fatal(err)
		}
		if err := srv.s.Serve(lis); err != nil {
			srv.logger.Fatal(err)
		}
	}()
}

func (srv *GrpcServer) GracefulStop() {
	srv.s.GracefulStop()
}
