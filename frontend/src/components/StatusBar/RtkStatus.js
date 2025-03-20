import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class RtkStatus extends React.Component {

  render() {
    const {
      electricityPercentage,
      rtkStatus
    } = this.props;

    return (
            <div className="battery-and-gears rtk-status">
                <div className="left-div">
                    <div className="text"> RtkStatus </div>
                </div>
                <div className="right-div">
                    <div className="text"> { rtkStatus || '' } </div>
                </div>
            </div>
    );
  }
}