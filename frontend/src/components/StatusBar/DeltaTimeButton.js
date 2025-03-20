import React from 'react';
import { inject, observer } from 'mobx-react';
import { QuestionCircleOutlined } from '@ant-design/icons';
@inject('store') @observer
export default class DeltaTimeButton extends React.Component {

  gotoDelateUrl() {
    window.open('https://robosense.feishu.cn/docx/NS53dP1lHoBgbfx3WGHcnd5fn8b', '_blank');
  }
  getClassName(key) {
    if (this.props.store.options[key]) {
      return 'main-button button-selected';
    }
    return 'main-button';
  }

  render() {
    return (
            <div className="delta-time-button">
                <div
                  className={this.getClassName('showPlanningStatusPanel')}
                  id="car-status"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showPlanningStatusPanel');
                  }}
                >状态</div>
                <div
                  className={this.getClassName('showDeltaTime')}
                  id="delta-time"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showDeltaTime');
                  }}
                >时延
                  <span><QuestionCircleOutlined className='delate-question' onClick={e => {
                    e.stopPropagation();
                    this.gotoDelateUrl();
                  }} /></span>
                </div>
                <div
                  className={this.getClassName('showLaneMap')}
                  id="lane-map"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showLaneMap');
                  }}
                >Lane</div>
                <div
                  className={this.getClassName('showGdMap')}
                  id="gd-map"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showGdMap');
                  }}
                >地图</div>
                <div
                  className={this.getClassName('showTurningline')}
                  id="turn-line"
                  onClick={() => {
                    this.props.store.handleOptionToggle('showTurningline');
                  }}
                >路口</div>
            </div>
    );
  }
}