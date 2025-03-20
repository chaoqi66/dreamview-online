import React from 'react';
import { inject, observer } from 'mobx-react';

import Draggable from 'react-draggable';
import classNames from 'classnames';

import './style.scss';

const defaultCamera = '/camera_fm_wide/image_color/compressed';

export class CameraVideo extends React.Component {
  render() {
    return (
      <div className="camera-video">
        <img src={this.props.imageSrcData} alt={'camera sensor'} />
        <p className="camera-time">{this.props.imageTimestamp}</p>
        <p className="camera-delta">{this.props.deltaT1}</p>
        <p className="camera-delta2">{this.props.deltaT2}</p>
      </div>
    );
  }
}

@inject('store') @observer
export default class SensorCamera extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      channels: [],
      value: 1,
      channel: '/camera_fm_wide/image_color/compressed'
    };

    this.onChangeHandler = this.onChangeHandler.bind(this);
    this.CAMERA_WS = this.props.CAMERA_WS;
  }

  onChangeHandler(event) {
    this.setState({
      value: event.target.value
    });
  }

  componentDidMount() {
    setTimeout(() => {
      const initChannel = this.props.cameraData?.defaultChannel || defaultCamera;
      if (initChannel) {
        const event = {
          target: {
            value: initChannel
          }
        };
        this.onStatusSelectChange(event);
      }
    }, 1000);
  }

  onStatusSelectChange = (event) => {
    const value = event.target.value;
    this.CAMERA_WS.setCameraChannel(value);
    this.setState({
      channel: value
    });
  };

  render() {
    const { cameraData, cameraName, cameraClass } = this.props;
    // console.log('cameraData = ', cameraData);
    const {
      hmi,
      options
    } = this.props.store;

    // 16:9
    const cameraWidth = 400;
    const cameraHeight = 225;
    const scaleRateList = [
      4, 3.5, 3, 2.5, 2, 1.5, 1
    ];

    const { playback } = this.props.store;

    return (
      <Draggable
        disabled={!options.cameraDraggable}
        cancel="select"
      >
        <div className={classNames({
          'camera-container': true,
          [cameraClass]: !!cameraClass
        })} id='camera-container'>
          <div className={classNames({
            'card': true,
            'camera': true
          })}>
            <div className="card-header">
              <span className='camera-name'>{cameraName}</span>
              <span className='camera_view_channel_select select-times'>
                <select
                  value={this.state.value}
                  onChange={this.onChangeHandler}
                >
                  {
                    scaleRateList.map((channel) => {
                      return (
                        <option key={channel} value={channel} label={`${channel} x`}>{channel}</option>
                      );
                    })
                  }
                </select>
              </span>
              <span className='camera_view_channel_select select-channel'>
                <span className="arrow" />
                <select
                  value={this.state.channel}
                  onChange={this.onStatusSelectChange}
                >
                  <option key={'select—Ïchannel'} value={''}>- select channel -</option>
                  {
                    playback.cameraChannel?.map((channel) => {
                      return (
                        <option key={channel.value} value={channel.value}>{channel.label}</option>
                      );
                    })
                  }
                </select>
              </span>
            </div>
            <div className="card-content-column camera-wrap" id={this.state.value} style={{ width: `${cameraWidth * this.state.value}px`, height: `${cameraHeight * this.state.value}px` }}>
              <CameraVideo
                imageSrcData={cameraData.imageSrcData}
                imageTimestamp={cameraData.imageTimestamp}
                deltaT1={cameraData.deltaT1}
                deltaT2={cameraData.deltaT2}
              />
            </div>
          </div>
        </div>
      </Draggable>
    );
  }
}