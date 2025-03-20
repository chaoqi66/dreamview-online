import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class LocalizationStatus extends React.Component {

  render() {
    const {
      electricityPercentage,
      locQuality
    } = this.props;

    return (
            <div className="battery-and-gears loc-status">
                <div className="left-div">
                    <div className="text"> LocStatus </div>
                </div>
                <div className="right-div">
                    <div className="text"> { locQuality ? locQuality.toFixed(1) : '' } </div>
                </div>
            </div>
    );
  }
}