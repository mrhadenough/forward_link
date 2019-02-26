package main

import (
	"encoding/base64"
	"encoding/binary"
	"flag"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	PICK_ROLE     = iota
	AUTHORIZE     = iota
	AUTH_FAILED   = iota
	PROVIDE_TOKEN = iota
	MASTER_TEXT   = iota
	MASTER_LINK   = iota
	SLAVE_TEXT    = iota
	SLAVE_LINK    = iota
)

type Message struct {
	Type    int
	Message string `json:"message"`
	Token   uint64 `json:"token"`
}

var channels = make(map[uint64](chan string))
var upgrader = websocket.Upgrader{}

// func NewToekn(n int) string {
// 	rand.Seed(time.Now().UnixNano())
// 	var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
// 	b := make([]rune, n)
// 	for i := range b {
// 		b[i] = letterRunes[rand.Intn(len(letterRunes))]
// 	}
// 	return string(b)
// }

func NewToekn(n int) uint64 {
	rand.Seed(time.Now().UnixNano())
	return uint64(rand.Int())
	// var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	// b := make([]rune, n)
	// for i := range b {
	// 	b[i] = letterRunes[rand.Intn(len(letterRunes))]
	// }
	// return string(b)
}

func Slave(c *websocket.Conn) {
	log.Println("Create slave")
	var ch chan string
	for {
		var msg Message
		log.Println("Wait for proper token from slave client")
		if err := c.ReadJSON(&msg); err != nil {
			log.Println(err)
			return
		}
		if msg.Type != AUTHORIZE {
			log.Printf("Slave expected token %d\n", msg.Type)
			continue
		}
		channel, ok := channels[Base64ToUint64(msg.Message)]
		if !ok {
			log.Println("wrong token")
			log.Println(c.WriteMessage(websocket.TextMessage, []byte("wrong token")))
			continue
		}
		// got valid token
		ch = channel
		break
		log.Println("Slave is listening now")
	}
	for {
		if err := c.WriteJSON(Message{Message: <-ch, Type: MASTER_TEXT}); err != nil {
			log.Println(err)
			break
		}
	}
	log.Println("Close slave")
}

func Uint64ToBase64(token uint64) string {
	bs := make([]byte, 8)
	binary.LittleEndian.PutUint64(bs, token)
	return base64.StdEncoding.EncodeToString(bs)
}

func Base64ToUint64(token string) uint64 {
	bs := base64.StdEncoding.DecodeString()
	if len(bs) != 8 {
		log.Println("Error converting base64 token to uint64, actual size = %d but should be 8", len(bs))
		return 0
	}
	return binary.LittleEndian.Uint64(bs)
}

func Master(c *websocket.Conn) {
	log.Println("Create master")
	token := NewToekn(4)
	ch := make(chan string)
	channels[token] = ch
	defer func() {
		close(ch)
		delete(channels, token)
	}()
	log.Println("Create new token", token)

	c.WriteJSON(Message{Message: Uint64ToBase64(token), Type: PROVIDE_TOKEN})
	for {
		var msg Message
		log.Println("Wait for master client to write")
		if err := c.ReadJSON(&msg); err != nil {
			log.Println(err)
			break
		}
		// if msg.Type != AUTHORIZE || msg.Type != MASTER_LINK {
		// 	log.Println("Unexpected message type %d for Master", msg.Type)
		// 	break
		// }
		ch <- string(msg.Message)
	}
	log.Println("Close master")
}

func GetRole(c *websocket.Conn) (string, error) {
	var msg Message
	if err := c.ReadJSON(&msg); err != nil {
		log.Println(err)
		return "", err
	}
	return string(msg.Type), nil
}

func WsHandler(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		log.Println("New connection, origin:", r.Header.Get("Origin"))
		return true
	}
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}
	// ? may be it's better to get role before loop
	defer c.Close()
	var role string
	var token string
	for {
		var msg Message
		if err := c.ReadJSON(&msg); err != nil {
			log.Println(err)
			log.Println("EXIT MAIN LOOP")
			return
		}
		switch msg.Type {
		case PICK_ROLE:
			log.Printf("ROLE %s", msg.Message)
			if msg.Message == "master" {
				go Master(c)
			}
			role = msg.Message
			log.Println("role:", role)
		case AUTHORIZE:
			channel, ok := channels[Base64ToUint64(msg.Message)]
			if !ok {
				log.Println("AUTH_FAILED", err)
				if err := c.WriteJSON(Message{Type: AUTH_FAILED}); err != nil {
					log.Println(err)
				}
				continue
			}
			// ? need to handle the case when connection lost
			// ? slave client send token and get authorized
			// ? for master client need to think how to handle the reconnection
			log.Println("AUTHORIZE")
			token = msg.Message
			log.Println("token:", token)
		case MASTER_TEXT:
			log.Println("MASTER_TEXT")
		case MASTER_LINK:
			log.Println("MASTER_LINK")
		}
		// if msg.Type == ROLE {
		// 	if msg.Message == "master" {
		// 		go Master(c)
		// 	} else {
		// 		go Slave(c)
		// 	}
		// }
		// return string(), err
	}
	// }()
	// role, err := GetRole(c)
	// if role == "master" {
	// 	go Master(c)
	// } else if role == "master" {
	// 	go Slave(c)
	// }
}

func main() {
	// log.Printf("PICK_ROLE %d", PICK_ROLE)
	// log.Printf("AUTHORIZE %d", AUTHORIZE)
	// log.Printf("MASTER_TEXT %d", MASTER_TEXT)
	// log.Printf("MASTER_LINK %d", MASTER_LINK)
	// log.Printf("SLAVE_TEXT %d", SLAVE_TEXT)
	// log.Printf("SLAVE_LINK %d", SLAVE_LINK)
	log.Println("Start server")
	flag.Parse()
	http.HandleFunc("/ws", WsHandler)
	http.Handle("/", http.FileServer(http.Dir("./templates")))
	http.Handle("/static", http.FileServer(http.Dir("./static")))
	log.Fatal(http.ListenAndServe("127.0.0.1:3000", nil))
}
