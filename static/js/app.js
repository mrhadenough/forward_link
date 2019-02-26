import React from 'React'
import ReactDOM from 'react-dom'

import Message from './message'

const
  MSG_PICK_ROLE = 0,
  MSG_AUTHORIZE = 1,
  MSG_AUTH_FAILED = 2,
  MSG_PROVIDE_TOKEN = 3,
  MSG_SEND_TEXT = 4;


const styles = {
  message: {
    border: '1px solid gray',
    borderRadius: '5px',
    padding: '5px',
    marginTop: '5px',
    flex: 1,
    backgroundColor: '#eee',
  },
  messageLink: {
    textDecoration: 'none',
    color: 'black',
    fontFamily: 'Arial',
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.sock = null
    this.state = {
      role: '',
      messages: [],
      wsConnected: false,
      loaded: false,
      token: '',
      error: null,
    }

    this.receiver = (e) => {console.log(e.data)}

    this.connectToServer = this.connectToServer.bind(this)
    this.onCreateMaster = this.onCreateMaster.bind(this)
    this.onCreateSlave = this.onCreateSlave.bind(this)
    this.checkToken = this.checkToken.bind(this)
    this.onMasterSend = this.onMasterSend.bind(this)
    this.send = this.send.bind(this)

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
        this.setState({ wsConnected: true })
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
      this.setState({ error, wsConnected: false })
      setTimeout(this.connectToServer, 1000)
    }

    this.sock.onmessage = (e) => {
      console.log("message received: " + e.data);
      this.receiver(e)
      // this.setState({value: e.data})
    }

    this.setState({loaded: true})
  }

  // master
  waitForText(e) {
    console.log(e.data)
    const data = JSON.parse(e.data)
    if (data.type == MSG_SEND_TEXT) {
      this.setState({ messages: [...this.state.messages, data] })
    } else {
      console.error('Wrong message type', e)
    }
  }

  // slave
  checkToken() {
    const message = document.getElementById('token').value
    this.send({ type: MSG_AUTHORIZE, message })
  }

  // master
  waitForToken(e) {
    const data = JSON.parse(e.data)
    if (data.type == MSG_AUTHORIZE) {
      this.setState({token: data.message})
    } else {
      console.error('Wrong message type', e)
    }
  }

  // slave
  waitWhenTokenValid(e) {
    const data = JSON.parse(e.data)
    switch (data.type) {
    case MSG_AUTHORIZE:
      this.setState({ token: e.data })
      this.receiver = this.waitForText
      break
    case MSG_AUTH_FAILED:
      console.error('Wrong token')
      this.setState({error: 'Wrong token'})
    default:
      console.error('Wrong message type')
      this.setState({error: 'Wrong message type'})
    }
  }

  send(msg) {
    console.log("send message", msg)
    this.sock.send(JSON.stringify(msg))
  }

  onCreateMaster() {
    this.receiver = this.waitForToken
    this.setState({role: 'master'})
    this.send({message: 'master', type: MSG_PICK_ROLE})
  }

  onCreateSlave() {
    console.log('Create slave')
    this.setState({role: 'slave'})
    this.receiver = this.waitWhenTokenValid
  }

  onMasterSend(e) {
    console.log("send message")
    const message = document.getElementById('message').value
    document.getElementById('message').value = ''
    this.send({ type: MSG_SEND_TEXT, message })
  };

  renderMessage(msg, key) {
    let link = msg.message
    if (!msg.message.startsWith('http://') && !msg.message.startsWith('https://')) {
      link = encodeURI(`http://google.com/search?q=${msg.message}`)
    }
    return (
      <a key={key} href={link} target="_blank" style={styles.messageLink}>
        <div style={styles.message}>
          {msg.message}
        </div>
      </a>
    )
  }

  renderMaster() {
    return (
      <div>
        <h5>Enter some text to search in google or direct link</h5>
        <p>Passcode: <b>{this.state.token}</b></p>
        <input type="text" id="message" placeholder="enter some text" />
        <button onClick={this.onMasterSend}>Send</button>
      </div>
    )
  }

  renderSlave() {
    if (this.state.token === '') {
      return (
        <div>
          <input type="text" id="token" placeholder="enter the code"/>
          <button onClick={this.checkToken}>Enter</button>
        </div>
      )
    }
    return (
      <div>
        <div>Items:</div>
        <div>{this.state.messages.map(this.renderMessage)}</div>
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
    if (this.state.role == 'master') {
      return this.renderMaster()
    }
    return this.renderSlave()
  }

  render() {
    return (
      <div style={{
        padding: '10px',
        borderTop: (this.state.wsConnected)? '4px solid #0c0' : '4px solid #ff2d00',
      }}>
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
