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
		var msg string
		if err := websocket.Message.Receive(ws, &msg); err != nil {
			fmt.Println("Can't receive")
			break
		}
		fmt.Printf("Received: %s\n", reply)
	}
}

func Emiter(ws *websocket.Conn) {

}

func DialUp(ws *websocket.Conn) {
	// we should implement full duplex connection

	// var err error

	for {
		// detect role
		// if receiver then need to take a password and validate it
		// if emiter then need to create the password and send to front
		// subsribe for receiving and emiting ws
		// create a map with hash (pass code) and forward messages
		fmt.Println("echo")
		var msg string

		if err := websocket.Message.Receive(ws, &msg); err != nil {
			fmt.Println("Can't receive")
			break
			// return
		}
		fmt.Printf("Received: %s\n", msg)

		if msg == "emiter" {
			Receiver(ws)
		}

		if msg == "receiver" {
			Emiter(ws)
		}

		go Receiver(ws)
		go Sender(ws)

		// if val, err := strconv.Atoi(reply); err == nil {
		// fmt.Println("NO ERRORS")
		// val++
		// reply = fmt.Sprintf("%d", val)
		// go increment(val, ws)
		// break
		// }a

		// fmt.Println("Received back from client: " + reply)

		// msg := "Received:  " + reply
		// fmt.Println("Sending to client: " + msg)

		// fmt.Println("reply", reply)
		// if err = websocket.Message.Send(ws, reply); err != nil {
		// 	fmt.Println("Can't send")
		// 	break
		// }
	}
}

func main() {
	http.Handle("/ws", websocket.Handler(DialUp))
	http.Handle("/", http.FileServer(http.Dir("./templates")))
	http.Handle("/static", http.FileServer(http.Dir("./static")))

	if err := http.ListenAndServe("127.0.0.1:3000", nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
