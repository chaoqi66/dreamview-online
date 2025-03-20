import React from 'react';
import { inject, observer } from 'mobx-react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  RollbackOutlined,
  EnterOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { isObservableArray } from 'mobx';

@inject('store')
@observer
export default class LaneTrafficLight extends React.Component {
  getTlColor(laneLight) {
    if (laneLight && laneLight.color) {
      let color = '';
      switch (laneLight.color) {
        case 'UNKNOWN': {
          color = '#d3d3d3';
          break;
        }
        case 'GREEN_FLASH': {
          color = 'green';
          break;
        }
        case 'YELLOW_FLASH': {
          color = 'orange';
          break;
        }
        case 'RED_FLASH': {
          color = 'red';
          break;
        }
        default:
          color = laneLight.color;
      }
      return color;
    } else {
      return '';
    }
  }

  getTlStyle(laneLight) {
    return {
      color: this.getTlColor(laneLight),
    };
  }

  getTlClass(laneLight) {
    const isFlash =
      laneLight && laneLight.color && laneLight.color.includes('_FLASH');
    if (isFlash) {
      if (laneLight.color === 'GREEN_FLASH') {
        return 'green-flash';
      }
      if (laneLight.color === 'YELLOW_FLASH') {
        return 'yellow-flash';
      }
    } else {
      return '';
    }
  }

  laneLightByType(laneLight) {
    let lightDom = null;
    const forwardTlStyle = this.getTlStyle(laneLight);
    const forwardTlClass = this.getTlClass(laneLight);
    const countdown = laneLight.countdown > 0 ? <div className="countdown">{laneLight.countdown}</div> : null;
    switch (laneLight.naviType) {
      case 'FORWARD':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <ArrowUpOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'TURN_LEFT':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <ArrowLeftOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'TURN_RIGHT':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <ArrowRightOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'UTURN_LEFT':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <RollbackOutlined
              className="icon rollback"
              style={forwardTlStyle}
            />
            {countdown}
          </div>
        );
        break;
      case 'FORWARD_LEFT':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <EnterOutlined className="icon rollback-left" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'FORWARD_RIGHT':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <EnterOutlined className="icon rollback-right" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'DUMMY_FORWARD':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <QuestionCircleOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      default:
        break;
    }
    return lightDom;
  }

  getLaneLight(autoCarLaneLight) {
    // if (!autoCarLaneLight.length) {return null;}
    return (
      <div className="traffic-light">
        {autoCarLaneLight.map((item) => {
          return this.laneLightByType(item);
        })}
      </div>
    );
  }

  render() {
    const { laneLightSet } = this.props;
    const autoCarLaneLight = laneLightSet && laneLightSet.filter(item => {
      if (item.isVirtual) {
        return false;
      }
      if (item.belongToCurrentLane && isObservableArray(item.belongToCurrentLane)) {
        return item.belongToCurrentLane.includes(true);
      }
      return false;
    });

    return (
      <div className="traffic-light-sign lane-light">
        <div className='traffic-title'>lane</div>
        {this.getLaneLight(autoCarLaneLight ?? [])}
      </div>
    );
  }
}