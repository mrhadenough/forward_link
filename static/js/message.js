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


  send() {
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


