import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class HumanIntervention extends React.Component {
  getCorrection(humanIntervention) {
    if (humanIntervention === 1) {
      return <span style={{fontSize: '14px', color: 'rgb(239,34,11)', fontWeight: 'bold'}}>Yes</span>;
    }
    if (humanIntervention === 2) {
      return <span style={{fontSize: '14px', color: '#ffffff'}}>No</span>;
    }
    // if (humanIntervention === 0) {
    //   return <span style={{fontSize: '14px', color: '#ffffff'}}>Unknown</span>;
    // }
    return '';
  }

  render() {
    const { humanIntervention } = this.props;
    return (
            <div className="battery-and-gears human-torque">
                <div className="left-div">
                    <div className="text">correction</div>
                </div>
                <div className="right-div">
                    <div className="text"> { humanIntervention !== undefined ? this.getCorrection(humanIntervention) : ''} </div>
                </div>
            </div>
    );
  }
}