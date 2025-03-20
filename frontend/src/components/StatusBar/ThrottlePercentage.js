import React from 'react';
import { inject, observer } from 'mobx-react';
import { roundNumber } from 'utils/misc';

@inject('store') @observer
export default class ThrottlePercentage extends React.Component {

  getClassName(throttlePercent) {
    if (throttlePercent > 0) {
      return 'text text-red';
    }
    return 'text';
  }
  render() {
    const { throttlePercent } = this.props;

    return (
            <div className="battery-and-gears throttle-percentage">
                <div className="left-div">
                    <div className="text">throttlePercent</div>
                </div>
                <div className="right-div">
                    <div className={this.getClassName(throttlePercent)}> { throttlePercent ? roundNumber(throttlePercent, 4) : 0} </div>
                </div>
            </div>
    );
  }
}