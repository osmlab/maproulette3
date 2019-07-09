import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { WidgetDataTarget, registerWidgetType }
       from '../../../services/Widget/Widget'
import ChallengeProgress from '../../ChallengeProgress/ChallengeProgress'
import QuickWidget from '../../QuickWidget/QuickWidget'
import WithChallengeMetrics
       from '../../AdminPane/HOCs/WithChallengeMetrics/WithChallengeMetrics'
import messages from './Messages'

const descriptor = {
  widgetKey: 'CompletionProgressWidget',
  label: messages.label,
  targets: [
    WidgetDataTarget.challenges,
    WidgetDataTarget.challenge,
    WidgetDataTarget.task
  ],
  minWidth: 3,
  defaultWidth: 4,
  minHeight: 2,
  defaultHeight: 7,
}

export default class CompletionProgressWidget extends Component {
  render() {
    const challenge = this.props.task ?
                      this.props.task.parent :
                      this.props.challenge
    return (
      <QuickWidget {...this.props}
                  className="completion-progress-widget"
                  widgetTitle={<FormattedMessage {...messages.title} />}>
         <ChallengeProgress {...this.props} className="" challenge={challenge} />
      </QuickWidget>
    )
  }
}

registerWidgetType(
  WithChallengeMetrics(CompletionProgressWidget), descriptor)
