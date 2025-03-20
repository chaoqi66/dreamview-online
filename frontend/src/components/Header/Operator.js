import React from 'react';
import { inject, observer } from 'mobx-react';

import CheckboxItem from 'components/common/CheckboxItem';
import { CAMERA_WS, CAMERA_WS2, CAMERA_WS3, CAMERA_WS4, CAMERA_WS5, CAMERA_WS6, CAMERA_WS7 } from 'store/websocket';
import WS from 'store/websocket';
import { Menu } from 'antd';
import MENU_DATA from 'store/config/MenuData';
import { getMenuIdOptionMap } from 'utils/misc';
import SubMenu from 'components/SideBar/MenuNew';
import _ from 'lodash';
import { toJS } from 'mobx';
import { roundNumber } from 'utils/misc';
import * as THREE from 'three';
import STORE from 'store/';

@inject('store') @observer
export default class Operator extends React.Component {
  render() {
    const menuIdOptionMapping = getMenuIdOptionMap();
    const { options, dimension, hmi } = this.props.store;
    const distanceList = toJS(this.props.store.meters.distanceList);
    const distanceListReal = [];
    for (let i = 0; i < distanceList.length; i = i + 2) {
      const startCoord = distanceList[i];
      const endCoord = distanceList[i + 1];
      let distance = null;
      if (startCoord && endCoord) {
        const pointA = new THREE.Vector2(startCoord.x, startCoord.y);
        const pointB = new THREE.Vector2(endCoord.x, endCoord.y);
        distance = pointA.distanceTo(pointB);;
      }
      distanceListReal.push({ start: startCoord, end: endCoord, distance });
    }

    const btnList = [
      {
        id: 'showOperator',
        title: 'Config'
      },
    ];
    const checkboxList = [
      // {
      //   id: 'showSideBar',
      //   title: 'SideBar'
      // },
      // {
      //   id: 'showTools',
      //   title: 'Tools'
      // },
      {
        id: 'showFollowCar',
        title: 'Follow Car'
      },
      {
        id: 'showDistance',
        title: 'distance'
      },
      {
        id: 'showBevRight',
        title: 'BEV Right'
      },
      // {
      //   id: 'showFollowCar',
      //   title: 'Follow Car'
      // },
      {
        id: 'showUniversalObstacles',
        title: 'Universal Obstacles'
      },
      {
        id: 'showPerceptionTypeStaticUnkonwn',
        title: 'Universal Obstacles ID'
      },
      {
        id: 'showPredictionObject',
        title: 'Prediction Object'
      },
      {
        id: 'showPerceptionObject',
        title: 'Perception Object'
      },
      {
        id: 'showPncObject',
        title: 'Pnc Object'
      },
      {
        id: 'showDeltaTime',
        title: 'Delta Time'
      },
      {
        id: 'showControlPanel',
        title: 'Control Panel'
      },
      {
        id: 'showPlanningStatusPanel',
        title: 'Planning Status'
      },
      {
        id: 'showTimestamp',
        title: 'Timestamp'
      },
      {
        id: 'showSpeedAcc',
        title: 'Speed and Acc'
      },
      // {
      //   id: 'showModuleDelay',
      //   title: 'Module Delay'
      // },
      {
        id: 'showMessageSize',
        title: 'WebSocket Network'
      },
      {
        id: 'showAutoCarHistory',
        title: 'Car Trajectory'
      },
      {
        id: 'hideText',
        title: 'Hide Text'
      },
      {
        id: 'showFrameRate',
        title: 'Frame Rate'
      },
      {
        id: 'showRangeView',
        title: 'Range View'
      },
      // {
      //   id: 'showHighMap',
      //   title: 'Show Map'
      // },
      // {
      //   id: 'showMapShoulder',
      //   title: 'Show Map Shoulder'
      // },
    ];
    const cameraList = [
      {
        id: 'cameraDraggable',
        title: 'Camera Draggable'
      },
      {
        id: 'showVideo',
        title: 'Camera View1'
      },
      {
        id: 'showVideo2',
        title: 'Camera View2'
      },
      {
        id: 'showVideo3',
        title: 'Camera View3'
      },
      {
        id: 'showVideo4',
        title: 'Camera View4'
      },
      {
        id: 'showVideo5',
        title: 'Camera View5'
      },
      {
        id: 'showVideo6',
        title: 'Camera View6'
      },
      {
        id: 'showVideo7',
        title: 'Camera View7'
      },
    ];
    const virtualList = [
      {
        id: 'showPositionCloseLoop',
        title: 'Virtual Localization'
      },
      {
        id: 'showVirtualChassis',
        title: 'Virtual Chassis'
      },
      {
        id: 'showVirtualCloseLoop',
        title: 'Planning Loop'
      },
    ];
    const posMapList = [
      {
        id: 'showPositionLocalization',
        title: 'Localization'
      },
      {
        id: 'showLaneMap',
        title: 'Lane Map'
      },
      {
        id: 'showPncPre',
        title: 'Pnc Prediction'
      },
      {
        id: 'showNaviTwoKm',
        title: 'Navi LD 2Km'
      },
      {
        id: 'showNaviSDTwoKm',
        title: 'Navi SD 2Km'
      },
      {
        id: 'showGdMap',
        title: 'Gd Map'
      },
      {
        id: 'showBehaviorMap',
        title: 'Behavior Map'
      },
    ];
    const roadStructureList = [
      {
        id: 'showRoadStructure',
        title: 'Road Structure'
      },
      {
        id: 'showPdLane',
        title: 'Pd Related'
      },
      {
        id: 'showVisibleLane',
        title: 'Visible Related'
      },
      {
        id: 'showNaviLane',
        title: 'Navi Related'
      },
      {
        id: 'showOtherLane',
        title: 'Other Related'
      },
      {
        id: 'showTurningline',
        title: 'Turning Line'
      },
      {
        id: 'showVectorizedLane',
        title: 'Vectorized Lane'
      },
      {
        id: 'showLaneId',
        title: 'Lane Id'
      },
      {
        id: 'showRdMultiLane',
        title: 'Multi Frame Lane'
      },
      {
        id: 'showRoadStructureCurb',
        title: 'Curb'
      },
      {
        id: 'showWorldBarrier',
        title: 'Barrier'
      },
    ];
    const roadStructurePerceptionList = [
      {
        id: 'showRoadStructurePerception',
        title: 'Road Perception'
      },
      {
        id: 'showRdStucPerceptionLane',
        title: 'Lane'
      },
      {
        id: 'showRdStucPerceptionLaneId',
        title: 'Lane Id'
      },
      {
        id: 'showSuccessorId',
        title: 'successor Id'
      },
      {
        id: 'showRdPerMultiLane',
        title: 'Multi Frame Lane'
      },
      {
        id: 'showRdStucPerceptionStopLine',
        title: 'Stop Line'
      },
      // {
      //   id: 'showRdStucPerceptionIntersection',
      //   title: 'Intersection Seg'
      // },
      // {
      //   id: 'showRdStucPerceptionCrosswalk',
      //   title: 'Crosswalk Seg'
      // },
      {
        id: 'showRoadStructureCurb',
        title: 'Curb'
      },
    ];
    const roadNetList = [
      {
        id: 'showRoadNet',
        title: 'Road Structure'
      },
      {
        id: 'showRoadNetLane',
        title: 'Lane'
      },
      {
        id: 'showRoadNetCurb',
        title: 'Curb'
      },
      {
        id: 'showRoadNetStopLine',
        title: 'Stop Line'
      },
      {
        id: 'showRoadNetFreeSpace',
        title: 'Free Space'
      },
      {
        id: 'showRoadNetIntersection',
        title: 'Intersection'
      },
      {
        id: 'showRoadNetCrosswalk',
        title: 'Crosswalk'
      },
      {
        id: 'showRoadNetNnPath',
        title: 'Nn Path'
      },
      {
        id: 'showNnPathSwitch',
        title: 'Nn Path Switch'
      },
      {
        id: 'showRoadNetProposals',
        title: 'Ego Proposals Monitor'
      },
    ];
    const menuList = [
      {id: 'checkboxIds', title: 'Common', children: checkboxList},
      {id: 'virtualList', title: 'Virtual', children: virtualList},
      {id: 'posMapList', title: 'Posotion & Map', children: posMapList},
      {id: 'roadNetList', title: 'Road Net', children: roadNetList},
      {id: 'roadStructureList', title: 'Road Navi', children: roadStructureList},
      {id: 'roadStructurePerceptionList', title: 'Road Perception', children: roadStructurePerceptionList},
      {id: 'cameraList', title: 'Camera', children: cameraList},
    ];

    const commonIds = ['cameraList', 'checkboxIds', 'virtualList', 'posMapList', 'roadStructureList', 'roadStructurePerceptionList', 'roadNetList'];
    MENU_DATA.forEach(item => {
      const children = [];
      Object.keys(item.data).forEach(key => {
        if (item.id === 'camera' && PARAMETERS.options.cameraAngle[`has${item.data[key]}`] === false) {
          return;
        }
        children.push({ id: menuIdOptionMapping[key], title: item.data[key], key: key });
      });
      if (item.id === 'planning' && options.customizedToggles.size > 0) {
        options.customizedToggles.keys().forEach((pathName) => {
          const titlePathName = _.startCase(_.snakeCase(pathName));
          children.push({ id: pathName, title: titlePathName, key: pathName, isCustomized: true });
        });
      }
      item.children = children;
      menuList.push(item);
    });

    const renderMenuItems = (items, tabId = '', tabType = '') => {
      return items.map((item) => {
        if (item.type === 'group') {
          return (
            <Menu.ItemGroup key={item.id} title={item.title}>
              {renderMenuItems(item.children, item.id, item.type)}
            </Menu.ItemGroup>
          );
        }

        if (item.children) {
          return (
            <Menu.SubMenu key={item.id} title={item.title}>
              {renderMenuItems(item.children, item.id, item.type)}
            </Menu.SubMenu>
          );
        }

        if (tabId && !commonIds.includes(tabId)) {
          return (
            <Menu.Item key={item.id}>
              <SubMenu
                tabId={tabId}
                tabType={tabType}
                options={options}
                dataId={item.key}
                title={item.title}
                id={item.id}
                isCustomized={item.isCustomized}
              />
            </Menu.Item>
          );
        }

        return (
          <Menu.Item key={item.id}>
            <CheckboxItem
              key={item.id}
              id={item.id}
              title={item.title}
              isChecked={options[item.id]}
              disabled={false}
              onClick={() => {
                menuItemClick(item.id);
              }}
            />
          </Menu.Item>
        );
      });
    };

    const menuItemClick = (id) => {
      this.props.store.handleOptionToggle(id);
      if (id === 'showSideBar' || id === 'showTools') {
        dimension.scene.width = window.innerWidth;
      }
      if (id === 'showVirtualCloseLoop') {
        // WS.toggleSimControl(options.showVirtualCloseLoop);
        // if (options.showVirtualCloseLoop) {
        //   console.log('WS = ', WS);
        //   console.log('WS.switchToVirtualCloseLoopModel = ', WS.switchToVirtualCloseLoopModel);
        //   WS.switchToVirtualCloseLoopModel();
        //   this.props.store.setOptionStatus('enableSimControl');
        //   this.props.store.setOptionStatus('showCloseLoop');
        // }
      }
      if (id === 'showVideo') {

      }
      if (id === 'showVideo2') {
        // CAMERA_WS2
        //   .getCameraChannel().then((channels) => {
        //     if (Array.isArray(channels) && channels.length > 0) {

        //     } else {
        //       alert('No camera channel found!');
        //     }
        //   });
      }
      if (id === 'showVideo3') {
        // CAMERA_WS3
        //   .getCameraChannel().then((channels) => {
        //     if (Array.isArray(channels) && channels.length > 0) {

        //     } else {
        //       alert('No camera channel found!');
        //     }
        //   });
      }
      if (id === 'showVideo4') {
        // CAMERA_WS4
        //   .getCameraChannel().then((channels) => {
        //     if (Array.isArray(channels) && channels.length > 0) {

        //     } else {
        //       alert('No camera channel found!');
        //     }
        //   });
      }
      if (id === 'showVideo5') {
        // CAMERA_WS5
        //   .getCameraChannel().then((channels) => {
        //     if (Array.isArray(channels) && channels.length > 0) {

        //     } else {
        //       alert('No camera channel found!');
        //     }
        //   });
      }
      if (id === 'showVideo6') {
        // CAMERA_WS6
        //   .getCameraChannel().then((channels) => {
        //     if (Array.isArray(channels) && channels.length > 0) {

        //     } else {
        //       alert('No camera channel found!');
        //     }
        //   });
      }
      if (id === 'showVideo7') {
        // CAMERA_WS7
        //   .getCameraChannel().then((channels) => {
        //     if (Array.isArray(channels) && channels.length > 0) {

        //     } else {
        //       alert('No camera channel found!');
        //     }
        //   });
      }
    };

    return (
        <div className="operator-btn">
            {
                btnList.map((item) => {
                  return (
                    <CheckboxItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        isChecked={options[item.id]}
                        disabled={false}
                        onClick={() => {
                          this.props.store.handleOptionToggle(item.id);
                        }}
                    />
                  );
                })
            }
            {
            options.showOperator &&
            <div className='operator-panel'>
              <Menu style={{ width: 200 }} mode="vertical" theme="dark" triggerSubMenuAction='click'>
                {renderMenuItems(menuList)}
              </Menu>
            </div>
            }
            {
              options.showDistance &&
              <div className='distance-panel'>
                <div>点击鼠标左键选择两点距离</div>
                {distanceListReal.map((item, index) => {
                  return <div className='distance-box'>
                    <div>{index}</div>
                    <div>start: {item.start &&
                      <span>{`(${roundNumber(item.start.x, 2)},${roundNumber(item.start.y, 2)})`}</span>}
                    </div>
                    <div>end: {item.end &&
                      <span>{`(${roundNumber(item.end.x, 2)},${roundNumber(item.end.y, 2)})`}</span>}
                    </div>
                    <div>distance: {item.distance && <span>{roundNumber(item.distance, 2)}</span>}</div>
                  </div>;
                })}
              </div>
            }
        </div>
    );
  }
}