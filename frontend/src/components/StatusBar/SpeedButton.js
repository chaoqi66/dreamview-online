import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';
import { toJS } from 'mobx';

@inject('store') @observer
export default class SpeedButton extends React.Component {
  getClassName(key, negation = false) {
    if ((negation && !this.props.store.options[key]) || (!negation && this.props.store.options[key])) {
      return 'main-button button-selected';
    }
    return 'main-button';
  }

  getFaultStyle() {
    const faultReport = toJS(STORE.meters.faultReport);
    let styles = { background: '#00aa00' };
    const obj = {
      WARNING: 0,
      ERROR: 1,
      FATAL: 2,
    };
    const objColor = {
      WARNING: '#dcb338',
      ERROR: '#ff00ff',
      FATAL: '#dc0004',
    };
    if (Array.isArray(faultReport)) {
      const list = faultReport.sort((a, b) => obj[b.faultLevel] - obj[a.faultLevel]);
      if (list && list.length) {
        const maxFaultLevel = list[0].faultLevel;
        styles = { background: objColor[maxFaultLevel] };
        return styles;
      }
    }
    return styles;
  }

  render() {
    return (
            <div className="speed-button">
                <div
                  className="main-button"
                  id="faultReport"
                  style={this.getFaultStyle()}
                  onClick={() => {
                    this.props.store.handleOptionToggle('showFaultReport');
                  }}
                >故障</div>
                <div
                  className={this.getClassName('showFrameRate')}
                  id="frame-rate"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showFrameRate');
                  }}
                >帧率</div>
                <div
                  className={this.getClassName('showFollowCar')}
                  id="followCar"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showFollowCar');
                  }}
                >跟车</div>
                <div
                  className={this.getClassName('showDistance')}
                  id="distance"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showDistance');
                  }}
                >测距</div>
                <div
                  className={this.getClassName('showPncNnCanvas')}
                  id="pncNnCanvas"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showPncNnCanvas');
                  }}
                >多帧</div>
                <div
                  className={this.getClassName('hideText', true)}
                  id="textCanvas"
                  onClick={() => {
                    this.props.store.handleOptionToggle('hideText');
                  }}
                >文字</div>
                <div
                  className={this.getClassName('showSpeedAcc')}
                  id="speedAcc"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showSpeedAcc');
                  }}
                >图表</div>
              <div
                className={this.getClassName('showAngleDense')}
                id="speedAcc"
                onClick={() => {
                  this.props.store.handleOptionToggle('showAngleDense');
                }}
              >转角</div>
            </div>
    );
  }
}