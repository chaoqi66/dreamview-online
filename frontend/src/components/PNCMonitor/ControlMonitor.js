import React from 'react';
import { inject, observer } from 'mobx-react';

import CheckboxItem from 'components/common/CheckboxItem';
import SETTING from 'store/config/ControlGraph.yml';
import ScatterGraph, { generateScatterGraph } from 'components/PNCMonitor/ScatterGraph';

@inject('store') @observer
export default class ControlMonitor extends React.Component {
  render() {
    const { options } = this.props.store;
    const { lastUpdatedTime, data } = this.props.store.controlData;

    if (!lastUpdatedTime) {
      return null;
    }

    const checkboxList = [
      {
        id: 'showPNCControlPanel',
        title: 'Control 控制面板'
      },
    ];

    return (
            <div>
              <div>
                {
                  checkboxList.map((item) => {
                    return (
                      <CheckboxItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        isChecked={options[item.id]}
                        disabled={false}
                        onClick={() => {
                          this.props.store.handleOptionToggle(item.id);
                        }}
                      />
                    );
                  })
                }
              </div>
                {generateScatterGraph(SETTING.trajectoryGraph, data.trajectoryGraph, {
                  pose: data.pose,
                })}
                {generateScatterGraph(SETTING.speedGraph, data.speedGraph)}
                {generateScatterGraph(SETTING.accelerationGraph, data.accelerationGraph)}
                {generateScatterGraph(SETTING.curvatureGraph, data.curvatureGraph)}
                {generateScatterGraph(SETTING.stationErrorGraph, data.stationErrorGraph)}
                {generateScatterGraph(SETTING.lateralErrorGraph, data.lateralErrorGraph)}
                {generateScatterGraph(SETTING.headingErrorGraph, data.headingErrorGraph)}
            </div>
    );
  }
}
