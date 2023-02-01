package uploader

import (
	"context"

	"github.com/pawanakhil/rapid-messenger/pkg/common"
)

type Router struct {
	httpServer common.HttpServer
}

func NewRouter(httpServer common.HttpServer) common.Router {
	return &Router{httpServer}
}

func (r *Router) Run() {
	r.httpServer.RegisterRoutes()
	r.httpServer.Run()
}
func (r *Router) GracefulStop(ctx context.Context) error {
	return r.httpServer.GracefulStop(ctx)
}
