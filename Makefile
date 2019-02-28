run:
	dep ensure
	go build -o bin/app
	DOMAIN="127.0.0.1:3000" ./bin/app

dbg:
	# go get github.com/cespare/reflex
	reflex -d none -R 'vendor/*' -R '.cache/*' -R 'node_modules/*' -r '\.go$\' -s -- sh -c 'make run'

watch:
	parcel templates/index.html

push:
	docker build -t mrhadenough/forward_link .
	docker push mrhadenough/forward_link
