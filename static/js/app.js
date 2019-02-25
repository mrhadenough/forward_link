import React from 'React'
import ReactDOM from 'react-dom'

import Message from './message'

class App extends React.Component {
  constructor(props) {
    super(props)

    this.sock = null
    this.state = {
      role: '',
      messages: '',
      wsReady: false,
      token: '',
      error: null,
    }

    this.receiver = (e) => {console.log(e.data)}

    this.connectToServer = this.connectToServer.bind(this)
    this.onCreateMaster = this.onCreateMaster.bind(this)
    this.onCreateSlave = this.onCreateSlave.bind(this)
    this.onCheckToken = this.onCheckToken.bind(this)
    this.onMasterSend = this.onMasterSend.bind(this)

    // master
    this.waitForToken = this.waitForToken.bind(this)
    // slave
    this.waitWhenTokenValid = this.waitWhenTokenValid.bind(this)
    this.waitForText = this.waitForText.bind(this)
  }

  componentDidMount() {
    console.log("did mount");
    this.connectToServer()
  }

  connectToServer() {
    while (true) {
      try {
        this.sock = new WebSocket('ws://127.0.0.1:3000/ws');
        break
      } catch (e) {
        console.error(e)
      }
    }

    this.sock.onopen = () => {
      this.setState({ error: null })
      console.log("connected");
    }

    this.sock.onclose = (e) => {
      const error = "connection closed (" + e.code + ")"
      console.log(error);
      this.setState({ error })
      setTimeout(this.connectToServer, 1000)
    }

    this.sock.onmessage = (e) => {
      console.log("message received: " + e.data);
      this.receiver(e)
      // this.setState({value: e.data})
    }

    this.setState({wsReady: true})
  }

  onCheckToken() {
    this.sock.send(document.getElementById('token').value)
  }

  waitForToken(e) {
    this.setState({token: e.data})
  }

  waitWhenTokenValid(e) {
    this.setState({token: e.data})
  }

  waitForText(e) {
    this.setState({message: e.data})
  }

  onCreateMaster() {
    this.setState({role: 'emiter'})
    this.sock.send('master')
  }

  onCreateSlave() {
    console.log('Create slave')
    this.setState({role: 'slave'})
    this.receiver = this.waitForText
  }

  onMasterSend(e) {
    console.log("send message")
    this.sock.send(document.getElementById('message').value)
  };

  renderMaster() {
    return (
      <div>
        <h5>Enter some text to search in google or direct link</h5>
        <p>Passcode: <b>{this.state.token}</b></p>
        <input type="text" id="message" placeholder="enter some text" onClick={this.onMasterSend} />
      </div>
    )
  }

  renderSlave() {
    return (
      <div>
        <input type="text" id="token" placeholder="enter the code"/>
        <button onClick={this.onCheckToken}>Enter</button>
      </div>
    )
  }

  renderError() {
    return <div style={{ color: 'red' }}>{this.state.error}</div>
  }

  renderApp() {
    if (this.state.role === '') {
      return (
        <div>
          <button onClick={this.onCreateMaster}>Create new channel</button>
          <button onClick={this.onCreateSlave}>Join channel</button>
        </div>
      )
    }
    if (this.state.role == 'emiter') {
      return this.renderMaster()
    }
    return this.renderSlave()
  }

  render() {
    return (
      <div>
        <div>{this.renderError()}</div>
        <div>{this.renderApp()}</div>
      </div>
    )

  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
)
