package chat

import (
	"github.com/pawanakhil/rapid-messenger/pkg/common"
	"github.com/pawanakhil/rapid-messenger/pkg/infra"
)

type InfraCloser struct{}

func NewInfraCloser() common.InfraCloser {
	return &InfraCloser{}
}

func (closer *InfraCloser) Close() error {
	return infra.RedisClient.Close()
}
