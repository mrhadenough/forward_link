import React from 'React'
import ReactDOM from 'react-dom'

import Message from './message'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      clientType: '',
    }
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

  render() {
    if (this.state.clientType === '') {
      return (
        <div>
          <button onClick={() => {this.setState({clientType: 'emiter'})}}>Create new channel</button>
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
