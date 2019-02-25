import React from 'React'
import ReactDOM from 'react-dom'

import Message from './message'

class App extends React.Component {
  constructor(props) {
    super(props)

    this.sock = null
    this.state = {
      clientType: '',
      messages: '',
      wsReady: false,
      value: 1,
    }

    this.onCreateEmiter = this.onCreateEmiter.bind(this)
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


  renderEmiter() {
    return (
      <div>
        <h5>Enter some text to search in google or direct link</h5>
        <p>Passcode: <b>a8BFj</b></p>
        <input type="text" placeholder=""/>
        <button>Enter</button>
      </div>
    )
  }

  renderReceiver() {
    return (
      <div>
        <input type="text" placeholder="enter the code"/>
        <button>Enter</button>
      </div>
    )
  }

  onCreateEmiter() {
    this.setState({clientType: 'emiter'})
    this.sock.send('create_emiter');
  }

  // onSend() {
  //   console.log("send message")
  //   let msg = document.getElementById('message').value;
  //   this.sock.send(msg);
  // };

  render() {
    if (this.state.clientType === '') {
      return (
        <div>
          <button onClick={this.onCreateEmiter}>Create new channel</button>
          <button onClick={() => {this.setState({clientType: 'receiver'})}}>Join channel</button>
        </div>
      )
    }
    if (this.state.clientType == 'emiter') {
      return this.renderEmiter()
    }
    return this.renderReceiver()
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
)
