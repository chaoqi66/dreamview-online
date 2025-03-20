import React, { useMemo, useRef, useCallback } from 'react';
import { Tooltip } from 'antd';
import { getUrlParam, formatTime, fromSecStr } from 'utils/misc';
import STORE from 'store';
import location_question_blue from 'assets/images/location/location_question_blue.png';
import location_question_red from 'assets/images/location/location_question_red.png';
import location_question_pink from 'assets/images/location/location_question_pink.png';
import location_question_orange from 'assets/images/location/location_question_orange.png';
import { correctionTypeMap } from 'utils/constant';
import moment from 'moment-timezone';
import { message } from 'antd';
// import useStyle from './useStyle';
message.config({
  top: 80,
});

const Nill = () => true;

const correctionTypeIcon = {
  LAT_CORRECTION: location_question_blue,
  LON_CORRECTION: location_question_orange,
  COMPLETE_MANUAL: location_question_pink,
  QUICK_BRAKE: location_question_red,
};

function Progress(props) {
  const dragElem = useRef();
  const { className, duration, progress, onChange = Nill, takeoverTime = [], issueDetail = null, controlBarInfo } = props;
  const style = useMemo(() => {
    const precent = (progress / duration) * 100;
    return {
      width: `${precent || 0}%`,
    };
  }, [duration, progress]);

  //   const { classes, cx } = useStyle();

  const getPointerPositionX = (e) => {
    const clientLeft = e.clientX;
    const { left } = dragElem.current.getBoundingClientRect();
    const maxPointerPositionX = dragElem.current.offsetWidth;
    const pointerPositionX = Math.min(Math.max(clientLeft - left, 0), maxPointerPositionX);
    return pointerPositionX;
  };

  const bindMoveEvent = () => {
    const moveHandler = (e) => {
      const maxPointerPositionX = dragElem.current.offsetWidth;
      const pointerPositionX = getPointerPositionX(e);
      const nextProgress = (pointerPositionX / maxPointerPositionX) * duration;
      onChange(nextProgress, `${(pointerPositionX / maxPointerPositionX) * 100}%`);
    };
    const upHandler = () => {
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('mousemove', moveHandler);
    };
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
  };

  const onMouseDown = (e) => {
    const maxPointerPositionX = dragElem.current.offsetWidth;
    const pointerPositionX = getPointerPositionX(e);
    const nextProgress = (pointerPositionX / maxPointerPositionX);
    onChange(nextProgress, `${(pointerPositionX / maxPointerPositionX) * 100}%`);
  };

  const issueClick = (offset) => {
    console.log(offset);
    const sliderEl = document.getElementById('progress-container');
    const { width } = sliderEl.getBoundingClientRect();
    const nextProgress = (offset * width + 0) / width;
    onChange(nextProgress);
  };

  const getIssueDom = () => {
    const eventTime = getUrlParam('eventTime');
    const len = controlBarInfo.length;
    const offset = (eventTime * 1e9 - controlBarInfo[0].timestamp) / (controlBarInfo[len - 1].timestamp - controlBarInfo[0].timestamp);
    return <div className='issue-item' style={{'left': `${offset * 100}%`}} onClick={() => issueClick(offset)}>
          <Tooltip className='issue-item-tip' title={issueTips(issueDetail)} color="blue">
        </Tooltip>
        </div>;
  };
  const takeOverTips = (issue, item) => {
    const time = moment(item.timestamp / (1e6)).format('YYYY-MM-DD HH:mm:ss');
    return <div>
      {`issue Key: ${issue?.key}`}
      <br />
      {`time: ${time}`}
      <br />
      {`接管类型: ${correctionTypeMap[item?.type] || ''}`}
      <br />
      </div>;
  };
  const takeOverIcons = useMemo(() => {
    const { historyData } = STORE.meters;
    const correctionType = historyData?.correction;
    if (historyData && historyData.correction) {
      const firstTimestamp = controlBarInfo[0].timestamp;
      const lastTimestamp = controlBarInfo[controlBarInfo.length - 1].timestamp;
      const timestampRange = lastTimestamp - firstTimestamp;
      const iconList = [];
      for (let i = 0; i < controlBarInfo.length; i++) {
        const currentTimestamp = controlBarInfo[i].timestamp;
        if (['LAT_CORRECTION', 'LON_CORRECTION', 'COMPLETE_MANUAL', 'QUICK_BRAKE'].includes(correctionType[currentTimestamp]?.correctionType) || correctionType[currentTimestamp]?.quickBrake) {
          let type = correctionType[currentTimestamp]?.correctionType;
          if (correctionType[currentTimestamp]?.quickBrake) {
            type = 'QUICK_BRAKE';
          }
          iconList.push({ timestamp: currentTimestamp, type });
        }
      }
      let filteredIconList = [];
      // iconList.forEach((item, index) => {
      //   if (index === 0 || (item.timestamp / 1e9 - (iconList[index - 1].timestamp / 1e9)) > 2) {
      //     filteredIconList.push(item);
      //   }
      // });

      const segments = [];
      let currentSegment = [];
      iconList.forEach((item, index) => {
        const currentTime = item.timestamp / 1e9;
        const prevTime = index > 0 ? iconList[index - 1].timestamp / 1e9 : currentTime;
        if (index === 0 || ((currentTime - prevTime) >= 1) || item.type !== iconList[index - 1]?.type) {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }
          currentSegment = [];
        }

        currentSegment.push(item);
      });

      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      segments.forEach(seg => {
        // if (seg[seg.length - 1].timestamp - seg[0].timestamp > 2 * 1e9) {
        //   filteredIconList.push({...seg[seg.length - 1], hideMessage: true});
        // }
        filteredIconList.push(seg[0]);
      });
      filteredIconList = filteredIconList.sort((a, b) => a.timestamp - b.timestamp);
      const filteredList = [];
      filteredIconList.forEach((item, index) => {
        const currentTime = item.timestamp / 1e9;
        const nextTime = index < filteredIconList.length - 1 ? filteredIconList[index + 1].timestamp / 1e9 : currentTime;

        if (index === filteredIconList.length - 1 || (nextTime - currentTime) >= 0.2) {
          filteredList.push(item);
        }
      });

      return filteredList.map((item) => {
        const eventTime = item.timestamp;
        const offset = (eventTime - firstTimestamp) / timestampRange;
        return {
          offset,
          item,
        };
      });
    }
    return null;
  }, [STORE.meters.historyData, controlBarInfo]);

  const getTakeOverIconDom = useCallback(() => {
    if (!takeOverIcons) {return null;}

    return takeOverIcons.map(({ offset, item }) => {
      const icon = correctionTypeIcon[item.type];
      if (item.timestamp / 1e9 === STORE.meters.cyberTimestamp && correctionTypeMap[item?.type]) {
        message.info(correctionTypeMap[item?.type]);
      }
      return <div
        className='location-icon-item'
        style={{ left: `calc(${offset * 100}% - 10px)`, background: `url(${icon})` }}
        onClick={() => issueClick(offset)}
        key={item.timeStamp}
      >
        <Tooltip className='issue-item-tip' title={takeOverTips(issueDetail, item)} color="blue" />
      </div>;
    });
  }, [takeOverIcons, issueDetail]);

  const issueTips = (issue) => {
    return <div>
      {`issue Key: ${issue?.key}`}
      <br />
      {`time: ${issue?.fields?.customfield_10210}`}
      <br />
      {issue?.fields?.summary}
      </div>;
  };

  const getTakeoverTimeStyle = (item) => {
    return {
      width: `${item.width * 100}%`,
      left: `${item.offset}px`,
      background: item.color
    };
  };

  const getTakeoverTimeDom = () => {
    if (takeoverTime.length) {
      return takeoverTime.map((item, index) => {
        return <div className='take-over-time' key={index} style={getTakeoverTimeStyle(item)}></div>;
      });
    }
    return null;
  };

  const binaryBarTyle = (item, index) => {
    const per = 1 / controlBarInfo.length;
    // let per = range / duration;
    // if (index === controlBarInfo.length - 1) {
    //   per += 0.01;
    // }
    return {
      width: `${per * 100}%`,
      background: item.isLoaded ? '#559CFA' : 'none'
      // cursor: item.isLoaded ? 'not-allowed' : 'pointer'
    };
  };


  return (
        <div className='progress-box'>
          <div ref={dragElem} onMouseDown={onMouseDown} className='progress-container' id='progress-container'>
            <div className='progress-background'>
                <div className='binary-load-status'>
                    {
                      controlBarInfo.map((item, index) => {
                        return <div style={binaryBarTyle(item, index)} key={item.id} className='binary-load_bar'>

                          </div>;
                      })
                    }
                </div>
                <div style={{ width: style.width }} className='progress-inner' />
                <div style={{ left: `calc(${style.width} - 6px)` }} className='progress-pointer' />
            </div>
          </div>
          {getTakeoverTimeDom()}
          {getIssueDom()}
          {getTakeOverIconDom()}
        </div>
  );
}

export default React.memo(Progress);
