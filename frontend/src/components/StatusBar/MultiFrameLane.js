import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';

@inject('store') @observer
export default class SpeedBuMultiFrameLanetton extends React.Component {

  changeStart = e => {
    STORE.meters.updateMultiFrameLane(e.target.value, null);
  };

  changeEnd = e => {
    STORE.meters.updateMultiFrameLane(null, e.target.value);
  };

  render() {
    return (
      <div className="multi-frame-lane">
        <div>
          起始帧数
          <input placeholder='起始帧' type="number" onChange={this.changeStart} />
        </div>
        <div>
          结束帧数
          <input placeholder='结束帧' type="number" onChange={this.changeEnd} />
        </div>
      </div>
    );
  }
}