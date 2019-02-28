run:
	dep ensure
	go build -o bin/app
	./bin/app

dbg:
	# go get github.com/cespare/reflex
	reflex -d none -R 'vendor/*' -R '.cache/*' -R 'node_modules/*' -r '\.go$\' -s -- sh -c 'make run'

watch:
	parcel templates/index.html

