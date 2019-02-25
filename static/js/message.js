import React from 'react'


export default class Message extends React.Component {
  constructor(props) {
    super(props)

    this.sock = null
    this.state = {
      wsReady: false,
      value: 1,
    }

    this.onSend = this.onSend.bind(this)
  }

  componentDidMount() {
    console.log("did mount");

    this.sock = new WebSocket('ws://127.0.0.1:3000/ws');

    this.sock.onopen = () => {
        console.log("connected");
    }

    this.sock.onclose = (e) => {
        console.log("connection closed (" + e.code + ")");
    }

    this.sock.onmessage = (e) => {
      this.setState({value: e.data})
      console.log("message received: " + e.data);
    }

    this.setState({wsReady: true})
  }

  onSend() {
    console.log("send message")
    let msg = document.getElementById('message').value;
    this.sock.send(msg);
  };


  render() {
    if (!this.state.wsReady) {
      return <div>Loading...</div>
    }
    return (
      <div>
        <input id="message" type="text" placeholder="message" value={this.state.value}/>
        <button onClick={this.onSend}>Send a message</button>
      </div>
    )
  }
}


