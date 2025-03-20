import React from 'react';
import { inject, observer } from 'mobx-react';

class StoryItem extends React.PureComponent {
  render() {
    const { name, value } = this.props;

    return (
        <div className="planning-status-item">
          <div className="name">{ name }</div>
          <div className="value">{ name === 'TimeStamp' ? value : value + ' (MB/s)' }</div>
        </div>
    );
  }
}

@inject('store') @observer
export default class MessageSize extends React.Component {

  render() {
    const {
      realtimeMessageSize,
      realtimeStamp,
      mapMessageSize,
    } = this.props.meters;

    const realtime = realtimeMessageSize ? (realtimeMessageSize / (1024 * 1024)).toFixed(4) : '';
    const maptime = mapMessageSize ? (mapMessageSize / (1024 * 1024)).toFixed(4) : '';
    const totalTime = ((realtimeMessageSize + mapMessageSize) / (1024 * 1024)).toFixed(4);

    const stories = [
      {
        name: 'TimeStamp',
        value: `${realtimeStamp || 0}`
      },
      {
        name: 'RealTime',
        value: `${realtime || 0}`
      },
      {
        name: 'Map',
        value: `${maptime || 0}`
      },
      {
        name: 'Total',
        value: `${totalTime || 0}`
      },
    ];

    let storyTable = null;
    storyTable = stories.map((item) =>
        <StoryItem key={`story_${item.name}`} name={item.name} value={item.value} />
    );

    return (
          <div className="message-size">{storyTable}</div>
    );
  }
}