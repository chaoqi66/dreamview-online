import React from 'react';
import { inject, observer } from 'mobx-react';
import classNames from 'classnames';

import DataRecorder from 'components/DataRecorder';
import ModuleController from 'components/ModuleController';
import Menu from 'components/SideBar/Menu';
import DefaultRouting from 'components/DefaultRouting';
import DataProfile from 'components/DataProfile';
import Tasks from 'components/Tasks';
import SensorCamera from 'components/Tasks/SensorCamera';
import { CAMERA_WS, CAMERA_WS2, CAMERA_WS3, CAMERA_WS4, CAMERA_WS5, CAMERA_WS6, CAMERA_WS7 } from 'store/websocket';
import Delay from 'components/Tasks/Delay';
import SimpleMonitor from 'components/Tasks/SimpleMonitor';
import NewControlGraph from 'components/StatusBar/NewControlGraph';
import SpeedAndAcc from 'components/StatusBar/SpeedAndAcc';
import PlaybackControls from 'components/PlaybackControls';
import CameraButton from 'components/StatusBar/CameraButton';
import SpeedButton from 'components/StatusBar/SpeedButton';
import MultiFrameLane from 'components/StatusBar/MultiFrameLane';
import FaultReport from 'components/StatusBar/FaultReport';
import FrameRateList from 'components/StatusBar/FrameRateList';
import BehaviorMap from 'components/StatusBar/BehaviorMap';
import NnPathSwitch from 'components/StatusBar/NnPathSwitch';
import { getCurConfig } from 'utils/misc';

@inject('store') @observer
export default class ToolView extends React.Component {
  getCameraClassByConfig() {
    const curConfig = getCurConfig();
    if (curConfig === 'PO') {
      return 'camera-container3-po';
    }
    return 'camera-container3';
  }
  render() {
    const {
      options, routeEditingManager, hmi, newDisengagementReminder,
      cameraData, cameraData2, cameraData3, cameraData4, cameraData5, cameraData6, cameraData7, isInitialized
    } = this.props.store;
    cameraData2.defaultChannel = '/camera_lb_pinhole/image_color/compressed';
    cameraData3.defaultChannel = '/camera_rb_pinhole/image_color/compressed';

    return (
      <div>
        {options.showTools &&
              <div className="tools">
                  {options.showTasks && <Tasks options={options} />}
                  {options.showModuleController && <ModuleController />}
                  {options.showMenu && <Menu options={options} />}
                  {options.showPOI && (
                      <DefaultRouting
                          routeEditingManager={routeEditingManager}
                          options={options}
                          inNavigationMode={hmi.inNavigationMode}
                      />
                  )}
                  {options.showDataRecorder && (
                      <DataRecorder
                          newDisengagementReminder={newDisengagementReminder}
                      />
                  )}
                {options.showProfile && (
                  <DataProfile
                    newDisengagementReminder={newDisengagementReminder}
                  />
                )}
              </div>}

        {/* {!options.showPNCMonitor && options.showSpeedAcc &&
          <div className={classNames({
            'new-control-graph': true,
            'delay-bottom': options.showTools
          })}>
              <NewControlGraph isDefault={true} />
          </div>
        } */}
        {!options.showPNCMonitor && options.showSpeedAcc && <div className='speed-acc'>
          <SpeedAndAcc isDefault={true} />
        </div>}
        {(options.showModuleDelay)
            && <Delay />}
        {(options.showSimpleMonitor)
            && <SimpleMonitor />}
        {(options.showVideo && isInitialized)
            && <SensorCamera cameraData={cameraData} CAMERA_WS={CAMERA_WS} cameraName={'Camera View 1'} cameraClass={'camera-container1'} />}
        {(options.showVideo2 && isInitialized)
            && <SensorCamera cameraData={cameraData2} CAMERA_WS={CAMERA_WS2} cameraName={'Camera View 2'} cameraClass={'camera-container2'} />}
        {(options.showVideo3 && isInitialized)
            && <SensorCamera cameraData={cameraData3} CAMERA_WS={CAMERA_WS3} cameraName={'Camera View 3'} cameraClass={this.getCameraClassByConfig()} />}
        {(options.showVideo4 && isInitialized)
            && <SensorCamera cameraData={cameraData4} CAMERA_WS={CAMERA_WS4} cameraName={'Camera View 4'} cameraClass={'camera-container4'} />}
        {(options.showVideo5 && isInitialized)
            && <SensorCamera cameraData={cameraData5} CAMERA_WS={CAMERA_WS5} cameraName={'Camera View 5'} cameraClass={'camera-container5'} />}
        {(options.showVideo6 && isInitialized)
            && <SensorCamera cameraData={cameraData6} CAMERA_WS={CAMERA_WS6} cameraName={'Camera View 6'} cameraClass={'camera-container6'} />}
        {(options.showVideo7 && isInitialized)
            && <SensorCamera cameraData={cameraData7} CAMERA_WS={CAMERA_WS7} cameraName={'Camera View 7'} cameraClass={'camera-container7'} />}
        {isInitialized && <PlaybackControls />}
        <CameraButton />
        {!options.showPNCMonitor && <SpeedButton />}
        {(options.showRdPerMultiLane || options.showRdMultiLane) && <MultiFrameLane />}
        {options.showFaultReport && <FaultReport />}
        {options.showFrameRate && <FrameRateList />}
        {options.showBehaviorMap && <BehaviorMap />}
        {options.showNnPathSwitch && <NnPathSwitch />}
      </div>
    );
  }
}
