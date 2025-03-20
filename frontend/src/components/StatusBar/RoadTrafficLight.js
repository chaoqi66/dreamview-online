import React from 'react';
import { inject, observer } from 'mobx-react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { isObservableArray } from 'mobx';

@inject('store')
@observer
export default class RoadTrafficLight extends React.Component {
  getTlColor(laneLight) {
    if (laneLight && laneLight.colorState) {
      let colorState = '';
      switch (laneLight.colorState) {
        case 'UNKNOWN': {
          colorState = '#d3d3d3';
          break;
        }
        case 'GREEN_FLASH': {
          colorState = 'green';
          break;
        }
        case 'YELLOW_FLASH': {
          colorState = 'orange';
          break;
        }
        case 'RED_FLASH': {
          colorState = 'red';
          break;
        }
        default:
          colorState = laneLight.colorState;
      }
      return colorState;
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
      laneLight && laneLight.colorState && laneLight.colorState.includes('_FLASH');
    if (isFlash) {
      if (laneLight.colorState === 'GREEN_FLASH') {
        return 'green-flash';
      }
      if (laneLight.colorState === 'YELLOW_FLASH') {
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
      case 'forward':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <ArrowUpOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'leftTurn':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <ArrowLeftOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'rightTurn':
        lightDom = (
          <div className={classNames('light', forwardTlClass)}>
            <ArrowRightOutlined className="icon" style={forwardTlStyle} />
            {countdown}
          </div>
        );
        break;
      case 'uTurn':
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
      default:
        break;
    }
    return lightDom;
  }

  getLaneLight(roadLights) {
    return (
      <div className="traffic-light">
        {roadLights.map((item) => {
          return this.laneLightByType(item);
        })}
      </div>
    );
  }

  render() {
    const { trafficLightFused } = this.props;
    let trafficLightSet = [];
    if (trafficLightFused) {
      const order = ['uTurn', 'leftTurn', 'forward', 'rightTurn'];
      const list = Object.keys(trafficLightFused).sort((a, b) => order.indexOf(a) - order.indexOf(b));;
      trafficLightSet = list.map((item => {
        return { ...trafficLightFused[item], naviType: item };
      }));
    }


    const roadLights = trafficLightSet && trafficLightSet.filter(item => {
      if (item.isExist) {
        return true;
      }
      return false;
    });
    debugger;

    return (
      <div className="road-light-sign lane-light">
        <div className='traffic-title'>road</div>
        {this.getLaneLight(roadLights ?? [])}
      </div>
    );
  }
}