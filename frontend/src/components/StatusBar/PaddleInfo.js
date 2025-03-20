import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class PaddleInfo extends React.Component {

  render() {
    const {
      electricityPercentage,
      humanLanePreference
    } = this.props;

    return (
            <div className="battery-and-gears paddle-lc">
                <div className="left-div">
                    <div className="text"> Paddle_LC </div>
                </div>
                <div className="right-div">
                    <div className="text"> { humanLanePreference || '' } </div>
                </div>
            </div>
    );
  }
}