run:
	dep ensure
	go build -o bin/app
	./bin/app
