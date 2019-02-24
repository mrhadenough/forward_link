package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"golang.org/x/net/websocket"
)

func increment(val int, ws *websocket.Conn) {
	for {
		val++
		reply := fmt.Sprintf("%d", val)
		if err := websocket.Message.Send(ws, reply); err != nil {
			fmt.Println("Can't send")
			break
		}
		time.Sleep(1 * time.Second)
	}
}

func Receiver(ws *websocket.Conn) {
	for {
		var reply string
		if err := websocket.Message.Receive(ws, &reply); err != nil {
			fmt.Println("Can't receive")
			break
		}
		fmt.Printf("Received: %s\n", reply)
	}
}

func Sender(ws *websocket.Conn) {

}

func DialUp(ws *websocket.Conn) {
	go Receiver(ws)
	go Sender(ws)

	// var err error

	// for {
	// 	fmt.Println("echo")
	// 	var reply string

	// 	if err = websocket.Message.Receive(ws, &reply); err != nil {
	// 		fmt.Println("Can't receive")
	// 		// break
	// 		return
	// 	}
	// 	fmt.Printf("Received: %s\n", reply)

	// 	if val, err := strconv.Atoi(reply); err == nil {
	// 		// fmt.Println("NO ERRORS")
	// 		// val++
	// 		// reply = fmt.Sprintf("%d", val)
	// 		go increment(val, ws)
	// 		// break
	// 	}

	// 	// fmt.Println("Received back from client: " + reply)

	// 	// msg := "Received:  " + reply
	// 	// fmt.Println("Sending to client: " + msg)

	// 	// fmt.Println("reply", reply)
	// 	// if err = websocket.Message.Send(ws, reply); err != nil {
	// 	// 	fmt.Println("Can't send")
	// 	// 	break
	// 	// }
	// }
}

func main() {
	http.Handle("/ws", websocket.Handler(DialUp))
	http.Handle("/", http.FileServer(http.Dir("./templates")))
	http.Handle("/static", http.FileServer(http.Dir("./static")))

	if err := http.ListenAndServe("127.0.0.1:3000", nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
