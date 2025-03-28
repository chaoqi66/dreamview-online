import { observable, computed, action } from 'mobx';

import HMI from 'store/hmi';
import StudioConnector from 'store/studio_connector';
import CameraData from 'store/camera_data';
import ControlData from 'store/control_data';
import Dimension from 'store/dimension';
import Latency from 'store/latency';
import Meters from 'store/meters';
import Monitor from 'store/monitor';
import Options from 'store/options';
import PlanningData from 'store/planning_data';
import PlanningStatus from 'store/planning_status';
import AutoDrivingCar from 'store/auto_driving_car';
import VirtualCar from 'store/virtual_car';
import Playback from 'store/playback';
import RouteEditingManager from 'store/route_editing_manager';
import StoryTellers from 'store/story_tellers';
import Teleop from 'store/teleop';
import TrafficSignal from 'store/traffic_signal';
import { throttle } from 'lodash';

class DreamviewStore {
    // Mutable States
    @observable timestamp = 0;

    @observable isInitialized = false;

    @observable studioConnector = new StudioConnector();

    @observable hmi = new HMI();

    @observable planningData = new PlanningData();

    @observable planningStatus = new PlanningStatus();

    @observable autoDrivingCar = new AutoDrivingCar();

    @observable virtualCar = new VirtualCar();

    @observable controlData = new ControlData();

    @observable latency = new Latency();

    @observable playback = new Playback();

    @observable trafficSignal = new TrafficSignal();

    @observable meters = new Meters();

    @observable monitor = new Monitor();

    @observable options = new Options();

    @observable routeEditingManager = new RouteEditingManager();

    @observable geolocation = {};

    @observable moduleDelay = observable.map();

    @observable cameraData = new CameraData();

    @observable cameraData2 = new CameraData();

    @observable cameraData3 = new CameraData();

    @observable cameraData4 = new CameraData();

    @observable cameraData5 = new CameraData();

    @observable cameraData6 = new CameraData();

    @observable cameraData7 = new CameraData();

    @observable storyTellers = new StoryTellers();

    @observable teleop = new Teleop();

    @observable dimension = new Dimension(this.hmi, this.options);

    @observable newDisengagementReminder = false;

    @observable offlineViewErrorMsg = null;

    @computed get enableHMIButtonsOnly() {
      return !this.isInitialized;
    }

    @action updateTimestamp(newTimestamp) {
      this.timestamp = newTimestamp;
    }

    @action setInitializationStatus(status) {
      this.isInitialized = status;
    }

    @action setGeolocation(newGeolocation) {
      this.geolocation = newGeolocation;
    }

    @action setOfflineViewErrorMsg(msg) {
      this.offlineViewErrorMsg = msg;
    }

    @action updateModuleDelay(world) {
      if (world && world.delay) {
        for (module in world.delay) {
          const hasNotUpdated = (world.delay[module] < 0);
          const delay = hasNotUpdated ? '-' : world.delay[module].toFixed(2);
          if (this.moduleDelay.has(module)) {
            this.moduleDelay.get(module).delay = delay;
          } else {
            this.moduleDelay.set(module, {
              delay,
              name: module[0].toUpperCase() + module.slice(1),
            });
          }
        }
      }
    }

    @action setPNCMonitorTab(index) {
      this.options.selectPNCMonitorTab = index;
    }

    handleOptionToggle(option) {
      const oldShowMonitor = this.options.showMonitor;
      const oldShowTools = this.options.showTools;
      const oldShowRouteEditingBar = this.options.showRouteEditingBar;

      this.options.toggle(option);

      // disable tools after toggling
      if (oldShowMonitor && !this.options.showMonitor) {
        this.dimension.disableMonitor();
      }
      if (oldShowRouteEditingBar && !this.options.showRouteEditingBar) {
        this.routeEditingManager.disableRouteEditing();
      }

      // enable selected tool
      if (!oldShowMonitor && this.options.showMonitor) {
        this.dimension.enableMonitor();
      } else if (oldShowTools !== this.options.showTools) {
        this.dimension.update();
      }
      if (option === 'showRouteEditingBar') {
        this.options.showPOI = false;
        this.routeEditingManager.enableRouteEditing();
      }
    }

    setOptionStatus(option, enabled) {
      const oldStatus = this.options[option];
      const newStatus = (enabled || false);
      if (oldStatus !== newStatus) {
        this.handleOptionToggle(option);
      }
    }

    updateCustomizedToggles(world) {
      const newToggles = {};
      if (world.planningData) {
        // Add customized toggles for planning paths
        if (world?.planningData?.path) {
          world.planningData.path.forEach((path) => {
            const pathName = path.name;
            if (this.options.customizedToggles.has(pathName)) {
              newToggles[pathName] = this.options.customizedToggles.get(pathName);
            } else {
              const hideList = ['origin_reference_trajectory', 'target_reference_trajectory', 'Planning PathData'];
              if (
                pathName.includes('planning_path_boundary') ||
                pathName.includes('PIECEWISE_JERK') ||
                hideList.includes(pathName)
              ) {
                newToggles[pathName] = false;
              } else {
                newToggles[pathName] = true;
              }
              if (world.mapMode === 'mapless') {
                if (pathName.includes('ILQR_')) {
                  newToggles[pathName] = true;
                }
              }
              // if (pathName === 'planning_reference_line_0') {
              //   newToggles[pathName] = true;
              // } else {
              //   newToggles[pathName] = false;
              // }
            }
          });
        }

        // Add pull over status toggle
        if (world.planningData.pullOver) {
          const keyword = 'pullOver';
          if (this.options.customizedToggles.has(keyword)) {
            newToggles[keyword] = this.options.customizedToggles.get(keyword);
          } else {
            newToggles[keyword] = true;
          }
        }
      }
      this.options.setCustomizedToggles(newToggles);
    }

    handleDrivingModeChange(wasAutoMode, isAutoMode) {
      if (this.options.enableSimControl) {
        return;
      }

      const hasDisengagement = wasAutoMode && !isAutoMode;
      const hasAuto = !wasAutoMode && isAutoMode;

      this.newDisengagementReminder = this.hmi.isCoDriver && hasDisengagement;
      if (this.newDisengagementReminder && !this.options.showDataRecorder) {
        this.handleOptionToggle('showDataRecorder');
      }

      // if (hasAuto && !this.options.lockTaskPanel) {
      //   this.handleOptionToggle('lockTaskPanel');
      // } else if (hasDisengagement && this.options.lockTaskPanel) {
      //   this.handleOptionToggle('lockTaskPanel');
      // }
    }

    consoleWorld = throttle((world) => {
      console.log('STORE.update = ', world);
    }, 3000);

    update(world, isNewMode) {
      this.consoleWorld(world);
      if (isNewMode) {
        this.options.resetOptions();
        this.dimension.disableMonitor();
        this.routeEditingManager.disableRouteEditing();
      }

      this.updateTimestamp(world.timestamp);
      this.updateModuleDelay(world);

      const wasAutoMode = this.meters.isAutoMode;
      this.meters.update(world);
      this.handleDrivingModeChange(wasAutoMode, this.meters.isAutoMode);

      this.monitor.update(world);
      this.trafficSignal.update(world);
      this.hmi.update(world);

      this.handlePlanningPath(world);
      this.updateCustomizedToggles(world);
      // if (this.options.showPNCMonitor) {
      this.storyTellers.update(world);
      this.planningData.update(world);
      this.virtualCar.update(world);
      this.controlData.update(world, this.hmi.vehicleParam);
      this.latency.update(world);
      // }
      this.planningStatus.update(world);
      this.autoDrivingCar.update(world);

      if (this.hmi.inCarTeleopMode) {
        this.setOptionStatus('showCarTeleopMonitor', true);
      } else if (this.hmi.inConsoleTeleopMode) {
        this.setOptionStatus('showConsoleTeleopMonitor', true);
      }
      if (world?.autoDrivingCar?.vehicleParam) {
        this.hmi.updateVehicleParam(world.autoDrivingCar.vehicleParam);
      }
    }

    handlePlanningPath(world) {
      if (world?.planningData?.path && (world.referenceLane || world.referenceTrajectory)) {
        world.planningData.path =
        [...world.planningData.path.filter(item => !/(reference_trajectory|planning_reference_line)/.test(item.name)), ...world.referenceLane, ...world.referenceTrajectory];
      }
    }

    reset() {
      const oldShowTools = this.options.showTools;
      const oldShowMonitor = this.options.showMonitor;
      this.options.resetOptions();
      if (oldShowMonitor && !this.options.showMonitor) {
        this.dimension.disableMonitor();
      }
      if (!oldShowMonitor && this.options.showMonitor) {
        this.dimension.enableMonitor();
      } else if (oldShowTools !== this.options.showTools) {
        this.dimension.update();
      }
      this.routeEditingManager.disableRouteEditing();
    }
}

const STORE = new DreamviewStore();

// For debugging purpose only. When turned on, it will insert a random
// monitor message into monitor every 10 seconds.
const timer = PARAMETERS.debug.autoMonitorMessage ? setInterval(() => {
  const item = [
    {
      level: 'FATAL',
      message: 'There is a fatal hardware issue detected. It might be '
                     + 'due to an incorrect power management setup. Please '
                     + 'see the logs for details.',
    }, {
      level: 'WARN',
      message: 'The warning indicator on the instrument panel is on. '
                     + 'This is usually due to a failure in engine.',
    }, {
      level: 'ERROR',
      message: 'Invalid coordinates received from the '
                     + 'localization module.',
    }, {
      level: 'INFO',
      message: 'Monitor module has started and is successfully '
                     + 'initialized.',
    }][Math.floor(Math.random() * 4)];
  STORE.monitor.insert(item.level, item.message, Date.now());
}, 10000) : null;

export default STORE;
