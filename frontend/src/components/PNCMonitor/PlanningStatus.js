import React from 'react';
import { inject, observer } from 'mobx-react';
import classNames from 'classnames';

class StoryItem extends React.PureComponent {
  render() {
    const { name, value, className } = this.props;
    const redValue = ['LCC', 'FALLBACK'];

    return (
      <div className="planning-status-item">
        <div className="name">{ name }</div>
        <div className={`value ${className}`} style={redValue.includes(value) ? { color: 'red' } : null}>
          {value}
        </div>
      </div>
    );
  }
}

@inject('store') @observer
export default class PlanningStatus extends React.Component {

  getLaneChangeClassName(laneChangeFsmStatus) {
    if (laneChangeFsmStatus === 'LANE_CHANGE_AWAIT') {
      return 'text-yellow';
    }
    if (laneChangeFsmStatus === 'IN_LANE_CHANGE') {
      return 'text-green';
    }
    if (laneChangeFsmStatus === 'REROUTE_FALLBACK') {
      return 'text-red';
    }
    return '';
  }
  getLccClassName(lanemapMapfreeSwitchMode, naviType, lccStatus) {
    if (lanemapMapfreeSwitchMode === 'mapfree' && naviType === 'LCC' && lccStatus === 'MAP_FREE') {
      return 'text-blue';
    }
    if (naviType === 'LCC') {
      return 'text-red';
    }
    return '';
  }
  render() {
    // console.log('this.props.store = ', this.props.store);
    const {
      trajectoryType,
      replanReason,
      laneChangeFsmStatus,
      expectationSpeed,
      latErrorToLaneCenter,
      pncDebug,
      lonBehavior,
      planningMode,
      naviType,
      lccStatus,
      roadIdList,
      laneMapVersion,
    } = this.props.store.planningStatus;
    const lccStatusMap = {
      DEFAULT: '',
      MAP_FREE: 'MAP_FREE',
      NO_ROUTE: '无高德导航信息',
      NO_ROUTE_POINT:'无粗导航点',
      REACH_NAVI_END: ' 即将到达终点',
      MPP_DEVIATION: 'MPP偏航',
      OTHERS: '其他',
    };
    const lccStatusText = lccStatusMap[lccStatus] ? `（${lccStatusMap[lccStatus]}）` : '';
    const laneMapVersionText = laneMapVersion ? laneMapVersion.replace(/(Behavior).*/i, '') : '';
    const { showPncDebug, showLonBehavior } = this.props.store.options;
    const {
      autoDrivingCar
    } = this.props.store.autoDrivingCar;
    const {
      virtualCar
    } = this.props.store.virtualCar;
    // console.log('trajectoryType = ', trajectoryType);
    // console.log('laneId = ', laneId);
    // console.log('targetLaneId = ', targetLaneId);
    // console.log('replanReason = ', replanReason);
    // console.log('autoDrivingCar = ', autoDrivingCar);
    // console.log('laneChangeFsmStatus = ', laneChangeFsmStatus);
    // console.log('expectationSpeed = ', expectationSpeed);
    // console.log('latErrorToLaneCenter = ', latErrorToLaneCenter);
    // console.log('virtualCar = ', virtualCar);

    // test
    const { meters } = this.props.store;
    const { pncReferenceLane, behaviorMap, naviLength } = meters;
    // console.log('meters = ', meters);

    // const laneIdStr = laneId ? laneId.map((item, index) => {
    //   let newItem = `${item.id} `;
    //   if((index + 1) % 3 === 0) {
    //     newItem = `${newItem}\n`;
    //   }
    //   return newItem;
    // }) : '';
    // const targetLaneIdStr = targetLaneId ? targetLaneId.map((item, index) => {
    //   let newItem = `${item.id} `;
    //   if((index + 1) % 3 === 0) {
    //     newItem = `${newItem}\n`;
    //   }
    //   return newItem;
    // }) : '';
    const roadIdStatus = {
      'ROAD_LOC_STATUS_TYPE_NONE': 'NONE',
      'ROAD_LOC_STATUS_TYPE_GOOD': 'GOOD',
      'ROAD_LOC_STATUS_TYPE_WARN': 'WARN',
      'ROAD_LOC_STATUS_TYPE_BAD': 'BAD',
    };
    const stories = [
      {
        name: 'cur_bin',
        value: meters.curBin || ''
      },
      {
        name: 'switch_mode',
        value: meters.lanemapMapfreeSwitchMode || ''
      },
      {
        name: 'lanemap_version',
        value: laneMapVersionText || ''
      },
      {
        name: 'behavior_version',
        value: behaviorMap?.version || ''
      },
      {
        name: 'trajectory_type',
        value: `${trajectoryType || ''}`
      },
      {
        name: 'replan_reason',
        value: `${replanReason || ''}`
      },
      {
        name: 'lc_fsm_status',
        value: `${laneChangeFsmStatus || ''}`,
        className: this.getLaneChangeClassName(laneChangeFsmStatus),
      },
      // {
      //   name: 'timestampSec',
      //   value: `${autoDrivingCar.timestampSec || ''}`
      // },
      // {
      //   name: 'expectation_speed',
      //   value: `${expectationSpeed || ''}`
      // },
      // {
      //   name: 'lat_error',
      //   value: `${latErrorToLaneCenter ? latErrorToLaneCenter.toFixed(6) : ''}`
      // },
      {
        name: 'navi_type',
        value: `${naviType}${lccStatusText}` || '',
        className: this.getLccClassName(meters.lanemapMapfreeSwitchMode, naviType, lccStatus),
        // className: naviType === 'LCC' ? 'text-red' : '',
      },
      {
        name: 'navi_length',
        value: naviLength ?? ''
      },
      {
        name: 'planning_mode',
        value: planningMode || ''
      },
      {
        name: 'ref_lane',
        value: pncReferenceLane || 'NORMAL'
      },
      {
        name: 'longitude',
        value: autoDrivingCar?.longitude || ''
      },
      {
        name: 'latitude',
        value: autoDrivingCar?.latitude || ''
      },
      {
        name: 'RoadID状态值',
        value: roadIdStatus[roadIdList.status] || ''
      },
      {
        name: 'RoadID个数',
        value: roadIdList?.roadIdSize
      },
      {
        name: '路口ID个数',
        value: roadIdList?.intersectionIdSize
      },
      {
        name: '导航ID个数',
        value: roadIdList?.navRoadIdSize
      },

      // {
      //   name: 'test',
      //   value: '----------------------------'
      // },
      // {
      //   name: 'brakePercent',
      //   value: `${meters.brakePercent}`
      // },
      // {
      //   name: 'throttlePercent',
      //   value: `${meters.throttlePercent}`
      // },
      // {
      //   name: 'acceleration',
      //   value: `${meters.acceleration}`
      // },
      // {
      //   name: 'steeringPercentage',
      //   value: `${meters.steeringPercentage}`
      // },
      // {
      //   name: 'steeringAngle',
      //   value: `${meters.steeringAngle}`
      // },
      // {
      //   name: 'steeringAngleRad',
      //   value: `${meters.steeringAngleRad}`
      // },
      // {
      //   name: 'disengageType',
      //   value: `${meters.disengageType}`
      // },
      // {
      //   name: 'drivingMode',
      //   value: `${meters.drivingMode}`
      // },
      // {
      //   name: 'isAutoMode',
      //   value: `${meters.isAutoMode}`
      // },
      // {
      //   name: 'newDrivingMode',
      //   value: `${meters.newDrivingMode}`
      // },
      // {
      //   name: 'isNewAutoMode',
      //   value: `${meters.isNewAutoMode}`
      // },
      // {
      //   name: 'chassisDrivingMode',
      //   value: `${meters.chassisDrivingMode}`
      // }
      // {
      //   name: 'lane_id',
      //   value: `${laneIdStr}`
      // },
      // {
      //   name: 'target_lane_id',
      //   value: `${targetLaneIdStr}`
      // }
    ];
    let storyTable = null;
    if (showPncDebug) {
      stories.push({ name: 'lcNNdebug', value: `${pncDebug ? pncDebug : ''}` });
    }
    if (showLonBehavior) {
      stories.push({ name: 'lon behavior', value: `${lonBehavior ? lonBehavior : ''}` });
    }
    storyTable = stories.map((item) => {
      const parameters_url = localStorage.getItem('PARAMETERS_URL');
      const parameters_obj = parameters_url ? JSON.parse(parameters_url) : {};
      const currentConfig = parameters_obj.label || 'default';
      if (currentConfig === 'pnc') {
        return  <StoryItem key={`story_${item.name}`} name={item.name} value={item.value} className={item.className} />;
      } else {
        if (item.name === 'planning_mode') {
          return null;
        }
        return  <StoryItem key={`story_${item.name}`} name={item.name} value={item.value} className={item.className} />;
      }
    });

    return (
    // <Tabs>
    //     <TabList>
    //         <Tab>PlanningStatus</Tab>
    //     </TabList>
    //     <TabPanel className="monitor-table-container">
    //         <table className="monitor-table">
    //             <tbody>{storyTable}</tbody>
    //         </table>
    //     </TabPanel>
    // </Tabs>
      <div className="planning-status">{storyTable}</div>
    );
  }
}