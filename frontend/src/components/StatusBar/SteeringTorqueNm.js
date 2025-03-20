import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class SteeringTorqueNm extends React.Component {

  render() {
    const { steeringTorqueNm } = this.props;

    return (
            <div className="battery-and-gears steering-torque">
                <div className="left-div">
                    <div className="text">steeringTorque</div>
                </div>
                <div className="right-div">
                    <div className="text"> { steeringTorqueNm ? steeringTorqueNm.toFixed(2) : 0 } </div>
                </div>
                <div className={`triangle-left steering-icon-left ${steeringTorqueNm > 0 ? 'triangle-left-highlight' : ''}`}></div>
                <div className={`triangle-right steering-icon-right ${steeringTorqueNm < 0 ? 'triangle-right-highlight' : ''}`}></div>
            </div>
    );
  }
}