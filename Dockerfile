FROM golang:1.12-alpine as go_base
RUN apk add --no-cache upx git

WORKDIR /app/
COPY main.go go.mod go.sum /app/
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o ./bin .
RUN upx --best ./bin

FROM node as node_base
RUN npm install -g parcel
WORKDIR /root/
COPY . .
RUN npm install
RUN parcel build --no-source-maps templates/index.html

FROM alpine:3.6
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=go_base /app/bin .
COPY --from=node_base /root/dist/ ./templates
CMD ["./bin"]
