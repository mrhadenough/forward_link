run:
	dep ensure
	go build -o bin/app
	./bin/app

dbg:
	reflex -r 'main.go$' -s -- sh -c 'go build -o bin/app && ./bin/app'
