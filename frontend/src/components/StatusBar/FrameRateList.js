import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';
import { toJS } from 'mobx';
import { roundNumber } from 'utils/misc';

@inject('store') @observer
export default class FrameRateList extends React.Component {

  render() {
    let channelsFrequency = toJS(STORE.meters.channelsFrequency);
    if (channelsFrequency && channelsFrequency.length) {
      channelsFrequency = channelsFrequency.filter(item => item.frequency);
    }

    return (
      <div className="frame-rate">
        <div className="frame-rate-title">帧率</div>
        <div className="frame-rate-list">
          {channelsFrequency && channelsFrequency.length ? channelsFrequency.map(item => {
            return (
              <div key={item.channelName} className="frame-rate-item">
                <div className='topic' title={item.channelName}>{item.channelName}</div>
                <div className='frequency'>{roundNumber(item.frequency, 3)}</div>
              </div>
            );
          }) : null}

        </div>
      </div>
    );
  }
}