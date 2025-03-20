import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class DrivingAction extends React.Component {

  render() {
    const {
      electricityPercentage,
      drivingAction
    } = this.props;

    return (
            <div className="battery-and-gears driving-action">
                <div className="left-div">
                    <div className="text"> DrivingAction </div>
                </div>
                <div className="right-div">
                    <div className="text"> { drivingAction } </div>
                </div>
            </div>
    );
  }
}