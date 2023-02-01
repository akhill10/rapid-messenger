package user

import (
	"context"

	userpb "github.com/pawanakhil/rapid-messenger/internal/proto_gen/user"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (srv *GrpcServer) GetUser(ctx context.Context, req *userpb.GetUserRequest) (*userpb.GetUserResponse, error) {
	user, err := srv.userSvc.GetUser(ctx, req.UserId)
	if err != nil {
		if err == ErrUserNotFound {
			return &userpb.GetUserResponse{
				Exist: false,
			}, nil
		}
		srv.logger.Error(err)
		return nil, status.Error(codes.Unavailable, err.Error())
	}
	return &userpb.GetUserResponse{
		Exist: true,
		User: &userpb.User{
			Id:   user.ID,
			Name: user.Name,
		},
	}, nil
}
