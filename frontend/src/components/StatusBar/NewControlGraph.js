import React from 'react';
import { inject, observer } from 'mobx-react';

import SETTING from 'store/config/NewControlGraph.yml';
import { generateScatterGraph } from 'components/PNCMonitor/ScatterGraph';

@inject('store') @observer
export default class NewControlGraph extends React.Component {
  render() {
    const { lastUpdatedTime, data } = this.props.store.controlData;

    if (!lastUpdatedTime) {
      return null;
    }

    return (
        <div className='speed-and-acc'>
            {generateScatterGraph(SETTING.speedGraph, data.realSpeedGraph)}
            {generateScatterGraph(SETTING.accelerationGraph, data.realAccelerationGraph)}
        </div>
    );
  }
}
