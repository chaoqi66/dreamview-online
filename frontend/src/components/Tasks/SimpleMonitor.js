import React from 'react';
import { inject, observer } from 'mobx-react';
import classNames from 'classnames';

import { millisecondsToTime } from 'utils/misc';

class SimpleMonitor extends React.PureComponent {
  render() {
    const { time, warning } = this.props;

    const timeString = (time === '-') ? time : millisecondsToTime(time | 0);

    return (
            <div className={classNames({ value: true, warning })}>
                {timeString}
            </div>
    );
  }
}

@inject('store') @observer
export default class SimpleMonitorTable extends React.Component {
  render() {
    const { moduleDelay, options } = this.props.store;

    const items = moduleDelay.keys().sort()
      .map((key) => {
        const module = moduleDelay.get(key);
        const warning = module.delay > 2000;

        return (
                    <div className="delay-item" key={`delay_${key}`}>
                        <div className="name">{module.name}</div>
                        <SimpleMonitor time={module.delay} warning={warning} />
                    </div>
        );
      });

    return (
          <div className={classNames({
            'simple-monitor': true,
            'simple-bottom': options.showTools
          })}>
            <div className="delay card">
                {/* <div className="card-header"><span>Module Delay</span></div> */}
                <div className="card-content-column">
                    {items}
                </div>
            </div>
          </div>
    );
  }
}
