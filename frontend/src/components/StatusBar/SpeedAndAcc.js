import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';

import SETTING from 'store/config/SpeedAndAccGraph.yml';
import { generateScatterGraph } from 'components/PNCMonitor/ScatterGraph';

@inject('store') @observer
export default class SpeedAndAcc extends React.Component {
  render() {
    const { lastUpdatedTime, data } = this.props.store.controlData;

    if (!lastUpdatedTime) {
      return null;
    }

    if (STORE.meters.historyData) {
      SETTING.angleGraph.options.axes.x.stepSize = 50;
      // SETTING.angleGraph.options.axes.y.type = 'logarithmic';
      SETTING.angleGraph.title = 'angleGraph';

      SETTING.angleDenseGraph.options.axes.x.stepSize = 50;
      SETTING.angleDenseGraph.options.axes.y.stepSize = 5;
      SETTING.angleDenseGraph.title = 'angleDenseGraph';

      SETTING.speedGraph.options.axes.x.stepSize = 50;
      SETTING.speedGraph.title = 'speedGraph';

      SETTING.accelerationGraph.options.axes.x.stepSize = 50;
      SETTING.accelerationGraph.title = 'accelerationGraph';
    }

    return (
        <div>
          <div className='speed-and-acc' id='speedAccChart'>
              {generateScatterGraph(SETTING.speedGraph, data.realSpeedGraph)}
              {generateScatterGraph(SETTING.accelerationGraph, data.realAccelerationGraph)}
          </div>
          <div className='angle' id='angleChart'>
              {generateScatterGraph(SETTING.angleGraph, data.realAngleGraph)}
          </div>
          {STORE.options.showAngleDense && <div className='angle-dense'>
              {generateScatterGraph(SETTING.angleDenseGraph, data.realAngleGraph)}
          </div>}
        </div>
    );
  }
}
