FROM golang:1.11.2 as go_base
COPY main.go Gopkg.toml Gopkg.lock /go/src/gitlab.com/mrhadenough/remote_keyboard_ws/
WORKDIR /go/src/gitlab.com/mrhadenough/remote_keyboard_ws/
RUN go get -u github.com/golang/dep/...
RUN dep ensure
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM node as node_base
RUN npm install -g parcel
WORKDIR /root/
COPY . .
RUN npm install
RUN parcel build templates/index.html

FROM alpine:3.6
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=go_base /go/src/gitlab.com/mrhadenough/remote_keyboard_ws/app .
COPY --from=node_base /root/dist/ ./templates
CMD ["./app"]
