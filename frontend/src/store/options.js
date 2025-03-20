import {
  observable, action, computed, extendObservable, isComputed,
} from 'mobx';

import _ from 'lodash';
import MENU_DATA from 'store/config/MenuData';
import { getMenuIdOptionMap } from 'utils/misc';
import RENDERER from 'renderer';

export const MONITOR_MENU = Object.freeze({
  PNC_MONITOR: 'showPNCMonitor',
  PREDICTION_MONITOR: 'showPredictionMonitor',
  EFFICIENT_MONITOR: 'showEfficientLaneMonitor',
  PROPOSALS_MONITOR: 'showRoadNetProposals',
  DATA_COLLECTION_MONITOR: 'showDataCollectionMonitor',
  CONSOLE_TELEOP_MONITOR: 'showConsoleTeleopMonitor',
  CAR_TELEOP_MONITOR: 'showCarTeleopMonitor',
  CAMERA_PARAM: 'showCameraView',
  FUEL_CLIENT: 'showFuelClient',
});

export const SAVE_OPTIONS = [
  'showSideBar', 'showTimestamp', 'showSpeedAcc', 'showPlanningStatusPanel',
  'showDeltaTime', 'showModuleDelay', 'showMessageSize', 'showControlPanel',
  'showPolygon', 'showVectorizedLane', 'showRoadStructure', 'showLaneMap', 'showHighMap', 'showRoadStructure',
  'showMapShoulder', 'showTopoTree', 'cameraDraggable', 'showPncDebug', 'showLonBehavior',
];
export const exitMenuIdOptions = ['showEfficientLane', 'showPlanningPath', 'showPlanningRSSInfo', 'showPlanningMultiPolicy', 'showPlanningTrajectory'];
export default class Options {
    // Toggles added by planning paths when pnc monitor is on
    @observable customizedToggles = observable.map();

    constructor() {
      this.cameraAngleNames = null;
      this.mainSideBarOptions = [
        'showTasks',
        'showModuleController',
        'showMenu',
        'showRouteEditingBar',
        'showDataRecorder',
        'showProfile',
      ];
      this.secondarySideBarOptions = ['showPOI'];
      this.menuIdOptionMapping = getMenuIdOptionMap();

      // Set options and their default values from PARAMETERS.options
      this.resetOptions();

      // Define toggles to hide in layer menu. These include PncMonitor
      // toggles, which are visible only when PNC Monitor is on.
      const togglesToHide = {
        perceptionPointCloud: OFFLINE_PLAYBACK,
        perceptionLaneMarker: OFFLINE_PLAYBACK,
        planningCar: OFFLINE_PLAYBACK,
      };
      this.togglesToHide = observable(togglesToHide);
    }

    @action resetOptions() {
      const options = {};
      for (const name in PARAMETERS.options) {
        let defaultValue = PARAMETERS.options[name].default;
        if (OFFLINE_PLAYBACK && name === 'showTasks') {
          defaultValue = false;
        }
        if (OFFLINE_PLAYBACK && name === 'showPositionShadow') {
          defaultValue = true;
        }
        options[name] = defaultValue;
      }
      extendObservable(this, options);
      const storageOptions = sessionStorage.getItem('saveOptions');
      if (storageOptions) {
        // const saveOptions = JSON.parse(storageOptions);
        // SAVE_OPTIONS.forEach(option => {
        //   this[option] = saveOptions[option];
        // });

        // if (this.menuIdOptionMapping) {
        //   Object.values(this.menuIdOptionMapping).forEach(option => {
        //     this[option] = saveOptions[option];
        //     // if (!exitMenuIdOptions.includes(option)) {
        //     //   this[option] = saveOptions[option];
        //     // }
        //   });
        // }
        sessionStorage.removeItem('saveOptions');
      }
    }

    @computed get showTools() {
      return this.showTasks
               || this.showModuleController
               || this.showMenu
               || this.showPOI
               || this.showDataRecorder
               || this.showProfile;
    }

    @computed get showGeo() {
      return this.showRouteEditingBar
               || this.cameraAngle === 'Map'
               || this.cameraAngle === 'Overhead'
               || this.cameraAngle === 'Orthographic'
               || this.cameraAngle === 'Monitor';
    }

    @computed get showMonitor() {
      for (const option of Object.values(MONITOR_MENU)) {
        if (this[option]) {
          return true;
        }
      }
      return false;
    }

    @computed get monitorName() {
      if (this.showConsoleTeleopMonitor) {
        return MONITOR_MENU.CONSOLE_TELEOP_MONITOR;
      } if (this.showCarTeleopMonitor) {
        return MONITOR_MENU.CAR_TELEOP_MONITOR;
      } if (this.showCameraView) {
        return MONITOR_MENU.CAMERA_PARAM;
      } if (this.showDataCollectionMonitor) {
        return MONITOR_MENU.DATA_COLLECTION_MONITOR;
      } if (this.showPNCMonitor) {
        return MONITOR_MENU.PNC_MONITOR;
      } if (this.showFuelClient) {
        return MONITOR_MENU.FUEL_CLIENT;
      } if (this.showPredictionMonitor) {
        return MONITOR_MENU.PREDICTION_MONITOR;
      }
      if (this.showEfficientLaneMonitor) {
        return MONITOR_MENU.EFFICIENT_MONITOR;
      }
      if (this.showRoadNetProposals) {
        return MONITOR_MENU.PROPOSALS_MONITOR;
      }
      return null;
    }

    @computed get showCameraView() {
      return this.cameraAngle === 'CameraView';
    }

    @action toggle(option, isCustomized) {
      if (isCustomized) {
        this.customizedToggles.set(option, !this.customizedToggles.get(option));
      } else {
        this[option] = !this[option];
      }

      if (option === 'showDimensionalCar') {
        RENDERER.adc.updateCarMesh(this[option]);
        RENDERER.closeLoopAdc.updateCarMesh(this[option], 0xff0000, 'closeLoopAdc');
      }

      if (option === 'showDistance') {
        !this[option] && RENDERER.removeDistanceMesh();
      }

      if (option === 'showAutoCarHistory') {
        RENDERER.carHistoryLocal.updateCarHistoryMesh();
      }

      // Disable other mutually exclusive options
      if (this[option] && this.mainSideBarOptions.includes(option)) {
        for (const other of this.mainSideBarOptions) {
          if (other !== option) {
            this[other] = false;
          }
        }
      }
      const monitorOptions = new Set(Object.values(MONITOR_MENU));
      if (monitorOptions.has(option)) {
        for (const other of monitorOptions) {
          if (other !== option && !isComputed(this, other)) {
            this[other] = false;
          }
        }
      }
    }

    @action setOption(option, value) {
      this[option] = value;
    }

    @action setCustomizedToggles(toggles) {
      // Set additional toggle in observable map
      this.customizedToggles.clear();
      if (toggles) {
        this.customizedToggles.merge(toggles);
      }
    }

    isSideBarButtonDisabled(option, enableHMIButtonsOnly, inNavigationMode) {
      if (!this.mainSideBarOptions.includes(option)
            && !this.secondarySideBarOptions.includes(option)) {
        console.warn(`Disable logic for ${option} is not defined, return false.`);
        return false;
      }

      // enable the side bar button as follows.
      if ([
        'showTasks',
        'showModuleController',
        'showProfile'
      ].includes(option)) {
        return false;
      } if (option === 'showRouteEditingBar') {
        return enableHMIButtonsOnly || inNavigationMode;
      } if (option === 'showPOI') {
        return enableHMIButtonsOnly || this.showRouteEditingBar;
      }
      return enableHMIButtonsOnly;
    }

    rotateCameraAngle() {
      if (!this.cameraAngleNames) {
        const cameraData = MENU_DATA.find((data) => data.id === 'camera');

        this.cameraAngleNames = Object.values(cameraData.data);
        // Default screen shielding shortcut key v switch cameraView
        const shouldFilterCameraView = _.get(PARAMETERS, 'cameraAngle.hasCameraView', false);
        if (shouldFilterCameraView) {
          this.cameraAngleNames = this.cameraAngleNames.filter((name) => name !== 'CameraView');
        }
      }

      const currentIndex = this.cameraAngleNames.findIndex((name) => name === this.cameraAngle);
      const nextIndex = (currentIndex + 1) % this.cameraAngleNames.length;
      this.selectCamera(this.cameraAngleNames[nextIndex]);
    }

    @action selectCamera(angleName) {
      this.cameraAngle = angleName;
    }
}
