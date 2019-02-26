package main

import (
	"flag"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	MSG_PICK_ROLE     = iota
	MSG_AUTHORIZE     = iota
	MSG_AUTH_FAILED   = iota
	MSG_PROVIDE_TOKEN = iota
	MSG_SEND_TEXT     = iota
	MSG_SEND_LINK     = iota
)

type Message struct {
	Type    int    `json:"type"`
	Message string `json:"message"`
	Token   uint64 `json:"token"`
}

var channels = make(map[string](chan string))
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

func NewToken(n int) string {
	rand.Seed(time.Now().UnixNano())
	// TODO: aboid 0 and collision
	// return uint64(rand.Int())
	var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

// func Uint64ToBase64(token uint64) string {
// 	bs := make([]byte, 8)
// 	binary.LittleEndian.PutUint64(bs, token)
// 	return base64.StdEncoding.EncodeToString(bs)
// }

// func Base64ToUint64(token string) uint64 {
// 	bs, err := base64.StdEncoding.DecodeString(token)
// 	if err != nil {
// 		return 0
// 	}
// 	if len(bs) != 8 {
// 		log.Printf("Error converting base64 token to uint64, actual size = %d but should be 8\n", len(bs))
// 		return 0
// 	}
// 	return binary.LittleEndian.Uint64(bs)
// }

func Master(c *websocket.Conn) {
	log.Println("Create master")
	token := NewToken(4)
	ch := make(chan string)
	channels[token] = ch
	defer func() {
		close(ch)
		delete(channels, token)
	}()
	log.Println("Create new token", token)

	// msg := strconv.Itoa(int(token))
	if err := c.WriteJSON(Message{Message: token, Type: MSG_AUTHORIZE}); err != nil {
		log.Println("Master", err)
		return
	}
	for {
		var msg Message
		log.Println("Wait for master client to write")
		if err := c.ReadJSON(&msg); err != nil {
			log.Println("Master", err)
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

func Slave(c *websocket.Conn, ch chan string) {
	log.Println("Created slave")
	for msg := range ch {
		log.Println("Slave wait for master channel")
		if err := c.WriteJSON(Message{Message: msg, Type: MSG_SEND_TEXT}); err != nil {
			log.Println("Slave", err)
			break
		}
		time.Sleep(100)
		log.Println("Slave sent message to UI")
	}
	log.Println("Close slave")
}

func GetRole(c *websocket.Conn) (string, error) {
	var msg Message
	if err := c.ReadJSON(&msg); err != nil {
		log.Println("Get role", err)
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
	defer c.Close()
	var role string
	for {
		var msg Message
		if err := c.ReadJSON(&msg); err != nil {
			log.Println(err)
			log.Println("EXIT MAIN LOOP")
			return
		}
		switch msg.Type {
		case MSG_PICK_ROLE:
			log.Printf("ROLE %s", msg.Message)
			if msg.Message == "master" {
				Master(c)
			}
			role = msg.Message
			log.Println("role:", role)
		case MSG_AUTHORIZE:
			log.Println("MSG_AUTHORIZE")
			if ch, ok := channels[msg.Message]; ok {
				log.Println("Send to slave MSG_AUTHORIZE success")
				if err := c.WriteJSON(Message{Type: MSG_AUTHORIZE}); err != nil {
					log.Println("Slave", err)
				}
				Slave(c, ch)
				continue
			}
			log.Println("AUTH_FAILED", err)
			log.Printf("%#v, %#v", channels, msg.Message)
			if err := c.WriteJSON(Message{Type: MSG_AUTH_FAILED}); err != nil {
				log.Println(err)
			}
		}
	}
}

func main() {
	log.Println("Start server")
	flag.Parse()
	http.HandleFunc("/ws", WsHandler)
	http.Handle("/", http.FileServer(http.Dir("./templates")))
	http.Handle("/static", http.FileServer(http.Dir("./static")))
	log.Fatal(http.ListenAndServe("127.0.0.1:3000", nil))
}
