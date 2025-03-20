import React from 'react';
import { inject, observer } from 'mobx-react';

class StoryItem extends React.PureComponent {
  getStyle(value) {
    let color = 'white';
    if (value > 0.5 && value < 1) {
      color = 'yellow';
    } else if (value >= 1) {
      color = 'red';
    }
    return { color };
  }

  showCalcFormula(name) {
    let title = '';
    const T0 = `${name}记录到record文件的时间`;
    switch (name) {
      case 'fusionObject': {
        title = `${T0} - (fusionObject.header.stamp.sec + fusionObject.header.stamp.nsec * 1e-9)`;
        break;
      }
      case 'prediction': {
        title = `${T0} - (prediction.perception_timestamp * 1e-6)`;
        break;
      }
      case 'planning2obj': {
        title = 'planning记录到record文件的时间 - planning.debug.planning_data.perception_timestamp';
        break;
      }
      case 'control2obj': {
        title = 'control记录到record文件的时间 - control.debug.input_debug.perception_timestamp';
        break;
      }
      case 'planning2ego': {
        title = 'planning记录到record文件的时间 - planning.header.timestamp_sec';
        break;
      }
      case 'control2ego': {
        title = 'control记录到record文件的时间 - control.header.timestamp_sec';
        break;
      }
      case 'chassis': {
        title = `${T0} - chassis.header.timestamp_sec`;
        break;
      }
      case 'trafficLight': {
        title = `${T0} - (trafficlight.header.stamp.sec + trafficlight.header.stamp.nsec * 1e-9)`;
        break;
      }
      case 'roadStructure': {
        title = `${T0} - road_structure.header.timestamp * 1e-9`;
        break;
      }
      case 'roadNet': {
        title = `${T0} - road_net.header.timestamp * 1e-9`;
        break;
      }
      case 'lanemap': {
        title = `${T0} - map.header.nsec_timestamp * 1e-9`;
        break;
      }
      case 'pcd': {
        title = '点云记录到record文件的时间 - (cloud.header.stamp.sec + cloud.header.stamp.nsec * 1e-9)';
        break;
      }
      case 'rtk': {
        title = `${T0} - rtk.header.timestamp_sec`;
        break;
      }
      case 'localization': {
        title = '以定位消息"/apollo/localization/pose"的时间为基准线';
        break;
      }
      default:
        title = '';
        break;
    }

    return title;
  }
  getChannelTime(name) {
    const { channelTimeStamp, deltaTime2_point_cloud } = this.props;
    if (name === 'pcd') {
      return deltaTime2_point_cloud?.pcd || '';
    }
    if (channelTimeStamp) {
      const time = channelTimeStamp[name];
      if (time) {
        return time;
      }
    }
    return '';
  }
  render() {
    const { name, value } = this.props;

    return (
        <div className="delta-item">
          <div className="name" title={this.showCalcFormula(name)}>{ name }</div>
          <div className="value" title={this.getChannelTime(name)} style={this.getStyle(value)}>{ (value || value === 0) ? value.toFixed(4) : '' }</div>
        </div>
    );
  }
}

@inject('store') @observer
export default class DeltaTime extends React.Component {

  render() {
    const {
      deltaTime1,
      deltaTime2,
      deltaTime1_point_cloud,
      deltaTime2_point_cloud,
      channelTimeStamp,
    } = this.props.meters;

    const order = [
      'rtk',
      'localization',
      'fusionObject',
      'prediction',
      'predictionAsy',
      'planning',
      'planning2ego',
      'planning2obj',
      'control',
      'control2ego',
      'control2obj',
      'chassis',
      'trafficLight',
      'roadStructure',
      'slimRoadNet',
      'lanemap',
      'pcd',
    ];

    const customKey = {
      predictionAsy: 'slow_prediction',
      slimRoadNet: 'roadNet',
    };

    const deltaTimeAll1 = {...deltaTime1, ...deltaTime1_point_cloud };
    const keyList1 = Object.keys(deltaTimeAll1).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const deltaTimeList1 = keyList1.map(key => {
      const realKey = customKey[key] ?? key;
      return {
        key: realKey,
        value: deltaTimeAll1[key]
      };
    });

    // const keyList2 = Object.keys(deltaTime2).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    // const deltaTimeList2 = keyList2.map(key => {
    //   return {
    //     key,
    //     value: deltaTime2[key]
    //   };
    // });

    let storyTable1 = null;
    storyTable1 = deltaTimeList1.map((item) =>
        <StoryItem channelTimeStamp={channelTimeStamp} deltaTime2_point_cloud={deltaTime2_point_cloud} key={`story_${item.key}`} name={item.key} value={item.value} />
    );

    // let storyTable2 = null;
    // storyTable2 = deltaTimeList2.map((item) =>
    //     <StoryItem key={`story_${item.key}`} name={item.key} value={item.value} />
    // );

    return (
        <div className='delta-wrap'>
          <div className="delta-info">{storyTable1}</div>
          {/* <div>{storyTable2}</div> */}
        </div>
    );
  }
}