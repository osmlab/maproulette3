import React, { Component } from 'react'
import { connect } from 'react-redux'
import { subscribeToReviewMessages, unsubscribeFromReviewMessages }
       from '../../../services/Task/Task'

/**
 * WithWebSocketSubscriptions makes websocket subscription functions available
 * to the WrappedComponent while taking care of automatically passing in the
 * redux dispatch that most subscription functions require
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
export const WithWebSocketSubscriptions = function(WrappedComponent) {
  return class extends Component {
    render() {
      return (
        <WrappedComponent
          {...this.props}
          subscribeToReviewMessages={this.props.subscribeToReviewMessages}
          unsubscribeFromReviewMessages={this.props.unsubscribeFromReviewMessages}
        />
      )
    }
  }
}

const mapDispatchToProps = dispatch => ({
  subscribeToReviewMessages: () => subscribeToReviewMessages(dispatch),
  unsubscribeFromReviewMessages: () => unsubscribeFromReviewMessages(),
})

export default WrappedComponent =>
  connect(null, mapDispatchToProps)(WithWebSocketSubscriptions(WrappedComponent))
