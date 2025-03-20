import React from 'react';
import { inject, observer } from 'mobx-react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import classNames from 'classnames';

@inject('store') @observer
export default class TrafficLightSign extends React.Component {
  getTlColor(turnTl) {
    if (turnTl && turnTl.colorState) {
      let color = '';
      switch (turnTl.colorState) {
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
        default:
          color = turnTl.colorState;
      }
      return color;
    } else {
      return '';
    }
  }

  getSmallLightColor(colorState) {
    let color = '';
    if (colorState) {
      switch (colorState) {
        case 'UNKNOWN': {
          color = '#d3d3d3';
          break;
        }
        default:
          color = colorState;
      }
    }
    return {
      color
    };
  }

  getTlStyle(turnTl) {
    return {
      display: turnTl && turnTl.isExist ? 'block' : 'none',
      color: this.getTlColor(turnTl)
    };
  }

  getTlClass(turnTl) {
    const isFlash = turnTl && turnTl.colorState && (turnTl.colorState.includes('_FLASH'));
    if (isFlash) {
      if (turnTl.colorState === 'GREEN_FLASH') {
        return 'green-flash';
      }
      if (turnTl.colorState === 'YELLOW_FLASH') {
        return 'yellow-flash';
      }
    } else {
      return '';
    }
  }

  render() {
    const {
      electricityPercentage,
      trafficLightSign
    } = this.props;

    const uturnTl = trafficLightSign && trafficLightSign.uturnTl;
    const lturnTl = trafficLightSign && trafficLightSign.lturnTl;
    const forwardTl = trafficLightSign && trafficLightSign.forwardTl;
    const rturnTl = trafficLightSign && trafficLightSign.rturnTl;

    const uturnTlStyle = this.getTlStyle(uturnTl);
    const lturnTlStyle = this.getTlStyle(lturnTl);
    const forwardTlStyle = this.getTlStyle(forwardTl);
    const rturnTlStyle = this.getTlStyle(rturnTl);

    const uturnTlClass = this.getTlClass(uturnTl);
    const lturnTlClass = this.getTlClass(lturnTl);
    const forwardTlClass = this.getTlClass(forwardTl);
    const rturnTlClass = this.getTlClass(rturnTl);


    const uturnMatchTlBuffer = trafficLightSign && trafficLightSign.uturnMatchTlBuffer;
    const uturnColorState = uturnMatchTlBuffer && uturnMatchTlBuffer.colorState || [];
    const uturnColorStyle = uturnColorState.map((color) => {
      return this.getSmallLightColor(color);
    });

    const lturnMatchTlBuffer = trafficLightSign && trafficLightSign.lturnMatchTlBuffer;
    const lturnColorState = lturnMatchTlBuffer && lturnMatchTlBuffer.colorState || [];
    const lturnColorStyle = lturnColorState.map((color) => {
      return this.getSmallLightColor(color);
    });

    const forwardMatchTlBuffer = trafficLightSign && trafficLightSign.forwardMatchTlBuffer;
    const forwardColorState = forwardMatchTlBuffer && forwardMatchTlBuffer.colorState || [];
    const forwardColorStyle = forwardColorState.map((color) => {
      return this.getSmallLightColor(color);
    });

    const rturnMatchTlBuffer = trafficLightSign && trafficLightSign.rturnMatchTlBuffer;
    const rturnColorState = rturnMatchTlBuffer && rturnMatchTlBuffer.colorState || [];
    const rturnColorStyle = rturnColorState.map((color) => {
      return this.getSmallLightColor(color);
    });

    return (
            <div className="traffic-light-sign">
              <div className="traffic-light">
                <div className={classNames('light rollback', uturnTlClass)}><RollbackOutlined className='icon' style={ uturnTlStyle } /></div>
                <div className={classNames('light', lturnTlClass)}><ArrowLeftOutlined className='icon' style={ lturnTlStyle } /></div>
                <div className={classNames('light', forwardTlClass)}><ArrowUpOutlined className='icon' style={ forwardTlStyle } /></div>
                <div className={classNames('light', rturnTlClass)}><ArrowRightOutlined className='icon' style={ rturnTlStyle } /></div>
              </div>
              <div className="small-light">
                <div className="light-list">
                  {
                    uturnColorStyle.map((style, index) => (
                      <div key={index} className={classNames('light-item rollback')}><RollbackOutlined className='icon' style={ style } /></div>
                    ))
                  }
                </div>
                <div className="light-list">
                  {
                    lturnColorStyle.map((style, index) => (
                      <div key={index} className="light-item"><ArrowLeftOutlined className='icon' style={ style } /></div>
                    ))
                  }
                </div>
                <div className="light-list">
                  {
                    forwardColorStyle.map((style, index) => (
                      <div key={index} className="light-item"><ArrowUpOutlined className='icon' style={ style } /></div>
                    ))
                  }
                </div>
                <div className="light-list">
                  {
                    rturnColorStyle.map((style, index) => (
                      <div key={index} className="light-item"><ArrowRightOutlined className='icon' style={ style } /></div>
                    ))
                  }
                </div>
              </div>
            </div>
    );
  }
}