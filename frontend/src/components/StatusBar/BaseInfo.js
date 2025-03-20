import React from 'react';
import { inject, observer } from 'mobx-react';

import { formatTime, fromSecStr } from 'utils/misc';
import Selector from 'components/Header/Selector';
import WS from 'store/websocket';
import { getUrlParam, copyHtmlText, copyTxt } from 'utils/misc';

class StoryItem extends React.PureComponent {

  render() {
    const { name, value } = this.props;

    return (
      <div className="base-info-item">
        <div className="name">{ name }</div>
        <div className="value">{ value }</div>
      </div>
    );
  }
}

@inject('store') @observer
export default class BaseInfo extends React.Component {
  constructor(props) {
    super(props);
    this.goVersionOld = this.goVersionOld.bind(this);
    this.issueKey = getUrlParam('issueKey');
    this.detailId = getUrlParam('detailId');
    this.source = getUrlParam('source');
  }
  goVersionOld() {
    const issueKey = getUrlParam('issueKey');
    const path = getUrlParam('path');
    const beginTime = getUrlParam('beginTime');
    const endTime = getUrlParam('endTime');
    const headTime = getUrlParam('headTime');
    const tailTime = getUrlParam('tailTime');
    // 构建新的URL
    const newUrl = 'http://datahub.robosense.cn/dreamview/transfer?' +
    'issueKey=' + issueKey +
    '&version=1' +
    '&path=' + path +
    '&beginTime=' + beginTime +
    '&endTime=' + endTime +
    '&headTime=' + headTime +
    '&tailTime=' + tailTime;
    window.open(newUrl, '_blank');
  }
  copyHtmlValue(issueKey) {
    const { issueDetail}  = this.props.store.meters;
    const url = `https://datahub-jira.robosense.cn/browse/${issueKey}`;
    const html = `<a href="${url}">${issueKey}</a>`;
    const text = issueDetail?.fields?.summary || '';
    const value = `${text}， ${html}`;
    copyHtmlText(value);
  }
  copyMapFile(txt) {
    copyTxt(txt);
  }
  getStyle(issueDetail) {
    let color = 'white';
    const name = issueDetail?.fields?.priority?.name;
    if (name) {
      if (name === 'Highest') {
        color = 'red';
      }
      if (name === 'High') {
        color = 'orange';
      }
      if (name === 'Medium') {
        color = 'yellow';
      }
    }
    return { color };
  }
  render() {
    const HMI_VERSION = '2.16.0.0';
    const { timestampSec, timestampTimeDiff, version, useHdmap } = this.props;
    const { meters } = this.props.store;
    const datetime = timestampSec ? formatTime(fromSecStr(timestampSec + '' || ''), null, 'YYYY-MM-DD HH:mm:ss.SSS') : '';
    const stories1 = [
      {
        name: 'version',
        value: `${version || ''}`
      },
      {
        name: 'hmi',
        value: HMI_VERSION
        // value: `${useHdmap ? HMI_VERSION : HMI_VERSION + ' (mapless)'}`
      },
      // {
      //   name: 'T0',
      //   value: `${timestampTimeDiff || ''}`
      // },
    ];

    const stories2 = [
      {
        name: 'timestamp',
        value: `${timestampSec || ''}`
      },
      {
        name: 'datetime',
        value: `${datetime || ''}`
      },
    ];

    const mapOptions = ['hdmap', 'mapless'];

    let storyTable1 = null;
    storyTable1 = stories1.map((item) => {
      const currentOption =  sessionStorage.getItem('useHdmap') || meters.mapMode;
      if (item.name === 'hmi') {
        return <div className="hmi-version" key={`hmi_${item.name}`}>
          <StoryItem key={`story_${item.name}`} name={item.name} value={item.value} />
          {/* <Selector
            name=""
            options={mapOptions}
            currentOption={currentOption}
            onChange={(event) => {
              WS.changeHasMap(event.target.value);
              sessionStorage.setItem('useHdmap', event.target.value);
              window.updateRoot();
              // window.location.reload();
            }}
          /> */}
          {/* <div onClick={this.goVersionOld} style={{'color': '#3288FA', cursor: 'pointer'}}>旧版观看</div> */}
          <div style={{'color': '#3288FA', cursor: 'pointer', marginLeft: '10px', height: '24px', marginTop: '-3px'}}>
            <a href='https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=ef1l6a48-3f65-44bd-b002-c7825e88b2cd' target='_black' style={{fontSize: '14px'}}>客服群</a>
          </div>
          {this.issueKey &&
            <div style={{'color': '#3288FA', cursor: 'pointer', marginLeft: '10px', height: '24px', marginTop: '-3px'}}>
              <a href={`https://datahub-jira.robosense.cn/browse/${this.issueKey}`} style={{fontSize: '14px'}} target='_black'>{this.issueKey}</a>
            </div>
          }
          {this.issueKey &&
            <div style={{'color': '#3288FA', cursor: 'pointer', marginLeft: '10px', height: '24px', marginTop: '-3px'}}>
              <a onClick={() => this.copyHtmlValue(this.issueKey)} style={{fontSize: '14px'}}>复制OB</a>
            </div>
          }
          {meters.tripId &&
            <div style={{'color': '#3288FA', cursor: 'pointer', marginLeft: '10px', height: '24px', marginTop: '-3px'}}>
              <a href={`http://datainfra.robosense.cn/fsd_auto/trip_detail/${meters.tripId}?tab=tripTrace&issueKey=${this.issueKey}`} style={{fontSize: '14px'}} target='_black'>{`Trip_${meters.tripId}`}</a>
            </div>
          }
          {meters.quickDataRecordUrl &&
            <div style={{'color': '#3288FA', cursor: 'pointer', marginLeft: '10px', height: '24px', marginTop: '-3px'}}>
              <a href={`${meters.quickDataRecordUrl}`} target='_black' style={{fontSize: '14px'}}>下载QD</a>
            </div>
          }
          {this.detailId &&
            <div style={{'color': '#3288FA', cursor: 'pointer', marginLeft: '10px', height: '24px', marginTop: '-3px'}}>
              <a href={`http://datainfra.robosense.cn/pnc_simulate/task_detail/${this.detailId}`} target='_black' style={{fontSize: '14px'}} >
                仿真详情
              </a>
            </div>
          }
        </div>;
      } else {
        return <StoryItem key={`story_${item.name}`} name={item.name} value={item.value} />;
      }
    });

    let storyTable2 = null;
    storyTable2 = stories2.map((item) =>
        <StoryItem key={`story_${item.name}`} name={item.name} value={item.value} />
    );

    const tripCity = meters.tripDetail?.tripCity || '';
    const carId = meters.tripDetail?.carId || '';
    let lineName = meters.issueDetail?.fields?.customfield_10502 || '';
    if (typeof lineName === 'object') {
      lineName = '';
    }
    const parts = [tripCity, carId, lineName].filter(Boolean);
    const mapText = parts.join(', ');

    return (
      <div className="base-info">
        <div className="base-wrap">{storyTable1}</div>
        <div>{storyTable2}</div>
        <div className='map-file'>
          <div className='map-summary' title={meters?.issueDetail?.fields?.summary || ''} onClick={() => this.copyMapFile(meters?.issueDetail?.fields?.summary || '')}>
            <span style={this.getStyle(meters.issueDetail)}>{meters?.issueDetail?.fields?.summary || ''}</span>
          </div>
          <div className='map-file-text' title={mapText || ''} onClick={() => this.copyMapFile(mapText)}>
            {mapText}
          </div>
        </div>
      </div>
    );
  }
};