import React from 'react';
import { inject, observer } from 'mobx-react';

class StoryItem extends React.PureComponent {
  render() {
    const { id, time1, time2 } = this.props;

    return (
        <div className="obstables-item">
          <div className="name">{ id }</div>
          <div className="value">{ time1 }</div>
          <div className="value">{ time2 }</div>
        </div>
    );
  }
}

@inject('store') @observer
export default class MessageSize extends React.Component {

  render() {
    const {
      objectNew
    } = this.props.meters;
    const objectFusion = objectNew && objectNew.objectFusion || [];
    objectFusion.forEach(item => {
      item.time1 = '10';
      item.time2 = '20';
    });
    objectFusion.unshift({
      id: 'id',
      time1: 'perception',
      time2: 'prediction',
    });
    for (let i = 0; i < 50; i++) {
      objectFusion.push({
        id: i,
        time1: '10',
        time2: '20',
      });
    }

    // console.log('objectFusion = ', objectFusion);

    let storyTable = null;
    storyTable = objectFusion.map((item) =>
        <StoryItem key={`story_${item.id}`} id={item.id} time1={item.time1} time2={item.time2} />
    );

    return (
          <div className="obstables-info">{storyTable}</div>
    );
  }
}