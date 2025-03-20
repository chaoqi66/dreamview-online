import React from 'react';
import { inject, observer } from 'mobx-react';
import { roundNumber } from 'utils/misc';

@inject('store') @observer
export default class MotorTorque extends React.Component {

  render() {
    const { motorTorque } = this.props;

    return (
            <div className="battery-and-gears motor-torque">
                <div className="left-div">
                    <div className="text">motorTorque</div>
                </div>
                <div className="right-div">
                    <div className="text"> { motorTorque !== undefined ? roundNumber(motorTorque, 2) : ''} </div>
                </div>
                <div className={`triangle-left steering-icon-left ${motorTorque > 0 ? 'triangle-left-highlight' : ''}`}></div>
                <div className={`triangle-right steering-icon-right ${motorTorque < 0 ? 'triangle-right-highlight' : ''}`}></div>
            </div>
    );
  }
}