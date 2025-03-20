import React from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Tooltip } from 'antd';

import Progress from './Progress';
import WS, { RA } from 'store/websocket';
import playImg from 'assets/images/icons/play.png';
import pauseImg from 'assets/images/icons/pause.png';
import { throttle } from 'lodash';
import { getUrlParam, fetchRequest } from 'utils/misc';
import location_question_blue from 'assets/images/location/location_question_blue.png';
import location_question_red from 'assets/images/location/location_question_red.png';
import location_question_pink from 'assets/images/location/location_question_pink.png';
import location_question_orange from 'assets/images/location/location_question_orange.png';

const PLAY_BACK_SPEED = [0.5, 1.0, 1.5, 2.0, 3.0];

// export enum PlayRecordStatus {
//   RUNNING = 'RUNNING',
//   PAUSED = 'PAUSED',
//   CLOSED = 'CLOSED',
// }

@inject('store')
@observer
export default class PlaybackControls extends React.Component {
  constructor(props) {
    super(props);

    this.handleRateChange = this.handleRateChange.bind(this);
    this.handleChangeProgress = this.handleChangeProgress.bind(this);
    this.onStart = this.onStart.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.state = {
      takeoverTime: [],
      issueDetail: null
    };
  }

  handleRateChange(event) {
    const { playback } = this.props.store;
    const newRate = parseFloat(event.target.value);
    playback.setPlayRate(newRate);
  }


  handleChangeProgress(progress) {
    const { playback } = this.props.store;
    const { playRecordStatus, isDataReady } = playback;
    if (!isDataReady) {return;}

    playback.resetRecordProgress(progress);
  }

  // 更新record列表节流函数
  handleKeyDown = throttle((event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); // 阻止默认的空格键行为
      event.stopPropagation(); // 停止事件传播
    }

    const { playback } = this.props.store;
    const { isDataReady, playRecordStatus, currentLoadingId } = playback;

    if (!isDataReady) {return;}

    if (playRecordStatus !== 'RUNNING' && playRecordStatus !== 'PAUSED') {
      return;
    }


    let nextIndex = null;
    if (event.key === 'ArrowLeft') {
      if (playRecordStatus === 'RUNNING') {
        this.onEnd();
      }
      nextIndex = currentLoadingId - 2;
    } else if (event.key === 'ArrowRight') {
      if (playRecordStatus === 'RUNNING') {
        this.onEnd();
      }
      nextIndex = currentLoadingId;
    } else {
      return;
    }
    if (nextIndex < 0) {return;}

    if (nextIndex === cacheData.length - 1) {
      nextIndex = 0;
    }

    playback.setCacheDataCurIndex(nextIndex);

  }, 150, { 'trailing': false });

  spaceKeydown = (event) => {
    const { playback } = this.props.store;
    const { playRecordStatus, isDataReady } = playback;
    if (!isDataReady) {return;}
    if (event.keyCode === 32) {

      event.preventDefault(); // 阻止默认的空格键行为
      event.stopPropagation(); // 停止事件传播
      if (playRecordStatus === 'RUNNING') {
        this.onEnd();
      } else {
        this.onStart();
      }
      return;
    }
  };

  onStart() {
    const { playback } = this.props.store;
    const { playRecordStatus, isDataReady } = playback;
    if (!isDataReady) {return;}
    if (playRecordStatus === 'PAUSED') {
      playback.setPlayRecordStatus('RUNNING');
    }
  }

  onEnd() {
    const { playback } = this.props.store;
    const { isDataReady } = playback;
    if (!isDataReady) {return;}
    playback.setPlayRecordStatus('PAUSED');
  }

  componentDidMount() {

    window.keyDownHandler = this.handleKeyDown.bind(this);
    window.spaceKeydownHandler = this.spaceKeydown.bind(this);
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keydown', spaceKeydownHandler);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
      }
    });
    this.getTaskName(getUrlParam('path'));
    this.fetchDriveModeUrl();
  }

  getJiraIssueList = async () => {
    const issueKey = getUrlParam('issueKey');
    const url = `http://datahub.robosense.cn/prod/jira/issue/detail/${issueKey}`;
    const res = await fetchRequest({ url });
    if (res.code === 200) {
      this.setState({ issueDetail: res.data });
      this.props.store.meters.updateIssueDetail(res.data);
    }
  };


  getTaskName = (path) => {
    // 取路径倒数第二个为文件名
    const firstPath = path.split(',')[0];
    const pathList = firstPath.split('/');
    const taskName = pathList[pathList.length - 2];
    // this.fetchDriveDurtion(taskName);
    this.getJiraIssueList();
  };

  handleDriveModeDurationTime = (arr) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 2 || arr[i] === 3 || arr[i + 1] === 2 || arr[i + 1] === 3) {
        continue;
      } else {
        const item = arr[i];
        let endTime = '';
        if (arr[i + 1]) {
          endTime = arr[i + 1].nodes[0].timestamp;
        } else {
          endTime = item.nodes[item.nodes.length - 1].timestamp;
        }
        const color = item.driveMode === 0 ? 'blue' : 'green';
        if (item && item.nodes && item.nodes.length) {
          result.push({
            beginTime: item.nodes[0].timestamp,
            endTime: endTime,
            color,
            offset: 0,
            width: 0
          });
        }
      }
    }
    return result;
  };

  getDriveModeDuration = (arr) => {
    if (!arr || !arr.length) {return;}
    const totalBeginTime = getUrlParam('beginTime');
    const totalEndTime = getUrlParam('endTime');
    const totalDurationTime = totalEndTime - totalBeginTime;
    const sliderEl = document.getElementById('progress-container');
    if(!totalBeginTime) {return;}
    const takeoverTime = this.handleDriveModeDurationTime(arr)
      .filter(item => {
        const itemDuration = item.endTime - item.beginTime;
        return (itemDuration + totalDurationTime) > Math.max(item.endTime, totalEndTime) - Math.min(item.beginTime, totalBeginTime);
      });
    takeoverTime[0].beginTime = totalBeginTime;
    takeoverTime[takeoverTime.length - 1].endTime = totalEndTime;
    takeoverTime.forEach(item => {
      item.width = (item.endTime - item.beginTime) / totalDurationTime;
      if (!sliderEl) {
        console.warn('No dom ref available for click handler');
        return 0;
      }
      const { width } = sliderEl.getBoundingClientRect();
      const offset = (width * (item.beginTime - totalBeginTime)) / totalDurationTime;
      item.offset = Math.ceil(offset) + 5;
    });
    this.setState({ takeoverTime });
  };

  async fetchDriveModeUrl() {
    const issueKey = getUrlParam('issueKey');
    try {
      const url = `http://datainfra.robosense.cn/api/trip_issue/get_extra_position_info?issueKey=${issueKey}`;
      const res = await fetchRequest({ url });
      if (res.code === 200) {
        const driveModeDataUrl = res?.data?.driveModeDataUrl || [];
        this.fetchDriveDurtion(driveModeDataUrl);
      }
    } catch (error) {
      console.error(error);
    }
  }

  fetchDriveDurtion = async (url) => {
    // const url = `http://10.199.2.100:8082/TenantAI:datahub/parsed_data/${taskName}/drive_mode_positions.json`;
    try {
      const res = await fetchRequest({ url });
      this.getDriveModeDuration(res);
    } catch (error) {
    }

  };

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  render() {
    const { hmi, dimension, playback } = this.props.store;
    const { takeoverTime, issueDetail } = this.state;
    const { currTimeS = 0, totalTimeS = 0, playRecordStatus, rate, isDataReady, controlBarInfo, currentLoadingId } = playback;
    const width = dimension.main.width;
    const isPlaying = playRecordStatus === 'RUNNING';
    const disabled = !isDataReady;
    const tip = () => {
      return (
        <div className='help-tips'>
          <div>快进1帧: 右箭头键 →</div>
          <div>后退1帧: 左箭头键 ←</div>
          <div>暂停/继续: 空格键</div>
          {takeoverTime.length > 0 && <div className='takeover-time-tips'>
            <div className='human-mode'><span></span>接管时间</div>
            <div className='auto-mode'><span></span>自驾时间</div>
          </div>}
          <div className='correction lat-correction'>
            <img height="20px" width="20px" src={location_question_blue} />
            方向盘接管
          </div>
          <div className='correction lat-correction'>
            <img height="20px" width="20px" src={location_question_orange} />
            油门接管
          </div>
          <div className='correction lat-correction'>
            <img height="20px" width="20px" src={location_question_pink} />
            人驾模式
          </div>
          <div className='correction lat-correction'>
            <img height="20px" width="20px" src={location_question_red} />
            急刹
          </div>
        </div>
      );
    };
    return (
      <div className="playback-controls" style={{ width: width}}>
          { disabled && (<div className='disabled-mask'></div>) }

          <div className="rate-selector" style={{ color: '#ffffff'}}>
            <select onChange={this.handleRateChange} value={rate} style={{ cursor: disabled ? 'not-allowed' : 'default' }}>
              {PLAY_BACK_SPEED.map((speed) => (
                <option key={speed} value={speed}>
                  {`x ${speed.toFixed(1)}`}
                </option>
              ))}
            </select>

             {/* { cacheDataCurIndex } */}
            <span className="arrow" />
          </div>
          <div className='left-controls'>
            {
              isPlaying
                ? (<img style={{ 'width': '14px' }} className="icon-img" src={pauseImg} onClick={this.onEnd}/>)
                : (<img className="icon-img" src={playImg} onClick={this.onStart} />)
            }

          </div>
          <span className='player-progress-text'>
              {currTimeS.toFixed(2)}
              &nbsp;/&nbsp;
              {totalTimeS.toFixed(2)}
          </span>
          <Progress
            onChange={this.handleChangeProgress}
            progress={currTimeS}
            duration={totalTimeS}
            controlBarInfo={controlBarInfo}
            takeoverTime={takeoverTime}
            issueDetail={issueDetail}
            className="player-progress"
          />
          <div className='play-tip'>
            <Tooltip title={tip} color="#2a2a2a">
              <div className='text'>帮助</div>
            </Tooltip>
          </div>
      </div>
    );
  }
}