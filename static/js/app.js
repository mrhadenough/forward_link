import React from 'react'
import ReactDOM from 'react-dom'

const
  MSG_PICK_ROLE = 0,
  MSG_AUTHORIZE = 1,
  MSG_AUTH_FAILED = 2,
  MSG_PROVIDE_TOKEN = 3,
  MSG_SEND_TEXT = 4;

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
    this.token = React.createRef();
    this.message = React.createRef();

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
    this.connectToServer()
  }

  connectToServer() {
    while (true) {
      try {
        if (process.env.NODE_ENV === 'development') {
          this.sock = new WebSocket("ws://127.0.0.1:3000/ws");
        } else {
          this.sock = new WebSocket(`ws://${location.host}/ws`);
        }
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
    this.send({ type: MSG_AUTHORIZE, message: this.token.current.value })
  }

  // master
  waitForToken(e) {
    const data = JSON.parse(e.data)
    if (data.type == MSG_AUTHORIZE) {
      this.setState({ token: data.message })
    } else {
      console.error('Wrong message type', e)
    }
  }

  // slave
  waitWhenTokenValid(e) {
    const data = JSON.parse(e.data)
    switch (data.type) {
    case MSG_AUTHORIZE:
      this.setState({ token: e.data, error: null })
      this.receiver = this.waitForText
      break
    case MSG_AUTH_FAILED:
      console.error('Wrong token')
      this.setState({error: 'Wrong token'})
      break
    default:
      console.error('Wrong message type', e.data)
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
    this.send({ type: MSG_SEND_TEXT, message: this.message.current.value })
    this.message.value = ''
  };

  renderMessage(msg, key) {
    let link = msg.message
    if (!msg.message.startsWith('http://') && !msg.message.startsWith('https://')) {
      link = encodeURI(`http://google.com/search?q=${msg.message}`)
    }
    return (
      <a key={key} href={link} target="_blank" className="message-link">
        <div className="message">
          {msg.message}
        </div>
      </a>
    )
  }

  renderMaster() {
    return (
      <div className="center-wrapper">
        <div className="passcode-wrapper">
          <span className="lock-icon">🔒→</span>
          <span className="passcode">{this.state.token}</span>
        </div>
        <div className="master-control-wrapper">
          <input type="text" ref={this.message} placeholder="enter text" />
          <button onClick={this.onMasterSend}>Send</button>
        </div>
      </div>
    )
  }

  renderSlave() {
    if (this.state.token === '') {
      return (
        <div className="master-control-wrapper">
          <input type="text" ref={this.token} placeholder="enter the code"/>
          <button onClick={this.checkToken}>Enter</button>
        </div>
      )
    }
    return (
      <div>
        <h3>Links</h3>
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
        <div className="main-buttons-wrapper">
          <button onClick={this.onCreateMaster}>New channel</button>
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
        <div className="refresh-page" onClick={() => {document.location.href = document.location.href}}>
          <span className="refresh-page-icon">&#x21bb;</span>
        </div>
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
