package uploader

import "github.com/pawanakhil/rapid-messenger/pkg/common"

type InfraCloser struct{}

func NewInfraCloser() common.InfraCloser {
	return &InfraCloser{}
}

func (closer *InfraCloser) Close() error {
	return nil
}
