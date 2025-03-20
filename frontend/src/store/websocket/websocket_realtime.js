import STORE from 'store';
import RENDERER from 'renderer';
import MAP_NAVIGATOR from 'components/Navigation/MapNavigator';
import UTTERANCE from 'store/utterance';
import Worker from 'utils/webworker.js';

export default class RealtimeWebSocketEndpoint {
  constructor(serverAddr) {
    this.serverAddr = serverAddr;
    this.websocket = null;
    this.simWorldUpdatePeriodMs = 100;
    this.simWorldLastUpdateTimestamp = 0;
    this.mapUpdatePeriodMs = 1000;
    this.mapLastUpdateTimestamp = 0;
    this.updatePOI = true;
    this.updateDefaultRoutingPoints = true;
    this.routingTime = undefined;
    this.currentMode = null;
    this.worker = new Worker();
    this.pointcloudWS = null;
    this.requestHmiStatus = this.requestHmiStatus.bind(this);
    this.updateParkingRoutingDistance = true;

    this.dataSize = 0;
  }

  initialize(serverAddr) {
    try {
      if (serverAddr) {
        this.serverAddr = serverAddr.replace('http', 'ws') + '/websocket';
      }
      this.websocket = new WebSocket(this.serverAddr);
      this.websocket.binaryType = 'arraybuffer';
    } catch (error) {
      console.error(`Failed to establish a connection: ${error}`);
      // setTimeout(() => {
      //   this.initialize();
      // }, 1000);
      return;
    }

    clearInterval(this.dataSizeTimer);
    this.dataSizeTimer = setInterval(() => {
      // console.log('websocketRealtime = ', this.dataSize / (1024 * 1024));
      STORE.meters.updateRealtimeMessageSize(this.dataSize);
      this.dataSize = 0;
    }, 1000);

    // clearInterval(this.dataSeqTimer);
    // this.dataSeqTimer = setInterval(() => {
    //   this.lastSequenceNum = this.sequenceNum;
    // }, 1000);

    this.websocket.onmessage = (event) => {
      this.worker.postMessage({
        source: 'realtime',
        data: event.data,
      });
    };
    this.worker.onmessage = (event) => {
      const message = event.data;
      const messageSize = JSON.stringify(message).length;
      // console.log('websocketRealtime messageSize = ', messageSize);
      this.dataSize += messageSize;
      STORE.meters.updateRealtimeStamp(Date.now());
      switch (message.type) {
        case 'HMIStatus':
          STORE.hmi.updateStatus(message.data);
          STORE.studioConnector.updateLocalScenarioInfo(message.data);
          RENDERER.updateGroundImage(STORE.hmi.currentMap);
          break;
        case 'VehicleParam':
          STORE.hmi.updateVehicleParam(message.data);
          break;
        case 'SimControlStatus':
          STORE.setOptionStatus('enableSimControl', message.enabled);
          break;
        case 'SimWorldUpdate':
          this.checkMessage(message);


          const isNewMode = (this.currentMode
            && this.currentMode !== STORE.hmi.currentMode);
          const isNavigationModeInvolved = (this.currentMode === 'Navigation'
            || STORE.hmi.currentMode === 'Navigation');
          this.currentMode = STORE.hmi.currentMode;
          if (STORE.hmi.shouldDisplayNavigationMap) {
            if (MAP_NAVIGATOR.isInitialized()) {
              MAP_NAVIGATOR.update(message);
            }

            if (STORE.hmi.inNavigationMode) {
              // In navigation mode, the coordinate system is FLU and
              // relative position of the ego-car is (0, 0). But,
              // absolute position of the ego-car is needed in MAP_NAVIGATOR.
              message.autoDrivingCar.positionX = 0;
              message.autoDrivingCar.positionY = 0;
              message.autoDrivingCar.heading = 0;

              RENDERER.coordinates.setSystem('FLU');
              this.mapUpdatePeriodMs = 100;
            }
          } else {
            RENDERER.coordinates.setSystem('ENU');
            this.mapUpdatePeriodMs = 1000;
          }

          STORE.update(message, isNewMode);
          RENDERER.maybeInitializeOffest(
            message.autoDrivingCar.positionX,
            message.autoDrivingCar.positionY,
            // Updating offset only if navigation mode is involved since
            // its coordination system is different from rest of the modes.
            isNewMode && isNavigationModeInvolved,
          );
          RENDERER.updateWorld(message);
          this.updateMapIndex(message);
          if (this.routingTime !== message.routingTime) {
            // A new routing needs to be fetched from backend.
            this.requestRoutePath();
            this.routingTime = message.routingTime;
          }
          break;
        case 'MapElementIds':
          RENDERER.updateMapIndex(message.mapHash,
            message.mapElementIds, message.mapRadius);
          break;
        case 'DefaultEndPoint':
          STORE.routeEditingManager.updateDefaultRoutingEndPoint(message);
          break;
        case 'DefaultRoutings':
          STORE.routeEditingManager.updateDefaultRoutingPoints(message);
          break;
        case 'AddDefaultRoutingPath':
          // used for user-defined routing: default routing,park and go routing
          STORE.routeEditingManager.addDefaultRoutingPath(message);
          break;
        case 'RoutePath':
          RENDERER.updateRouting(message.routingTime, message.routePath);
          break;
        case 'RoutingPointCheckResult':
          if (message.error) {
            RENDERER.removeInvalidRoutingPoint(message.pointId, message.error);
          }
          break;
        case 'DataCollectionProgress':
          if (message) {
            STORE.hmi.updateDataCollectionProgress(message.data);
          }
          break;
        case 'PreprocessProgress':
          if (message) {
            STORE.hmi.updatePreprocessProgress(message.data);
          }
          break;
        case 'ParkingRoutingDistance':
          if (message) {
            STORE.routeEditingManager.updateParkingRoutingDistance(message.threshold);
          }
          break;
      }
    };
    this.websocket.onopen = (event) => {
      const { mapMode } = STORE.meters;
      mapMode && this.changeHasMap(mapMode);

      if (STORE.meters.mapFile) {
        this.changeMap(STORE.meters.mapFile);
      }
    };
    this.websocket.onclose = (event) => {
      console.log(`WebSocket connection closed, close_code: ${event.code}`);

      // this.initialize();
    };

  }

  checkWsConnection() {
    if (this.websocket.readyState === this.websocket.OPEN) {
      return this;
    }
    return this.initialize();
  }

  updateMapIndex(message) {
    const now = new Date();
    const duration = now - this.mapLastUpdateTimestamp;
    if (message.mapHash && duration >= this.mapUpdatePeriodMs) {
      RENDERER.updateMapIndex(message.mapHash, message.mapElementIds, message.mapRadius);
      this.mapLastUpdateTimestamp = now;
    }
  }

  checkMessage(world) {
    const now = new Date().getTime();
    const duration = now - this.simWorldLastUpdateTimestamp;
    if (this.simWorldLastUpdateTimestamp !== 0 && duration > 200) {
      console.warn(`Last sim_world_update took ${duration}ms`);
    }
    if (this.secondLastSeqNum === world.sequenceNum) {
      // Receiving multiple duplicated simulation_world messages
      // indicates a backend lag.
      console.warn('Received duplicate simulation_world:', this.lastSeqNum);
    }
    this.secondLastSeqNum = this.lastSeqNum;
    this.lastSeqNum = world.sequenceNum;
    this.simWorldLastUpdateTimestamp = now;
  }

  requestSimulationWorld(requestPlanningData) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RequestSimulationWorld',
      planning: requestPlanningData,
    }));
  }

  checkRoutingPoint(point) {
    const request = {
      type: 'CheckRoutingPoint',
      point,
    };
    this.websocket && this.websocket.send(JSON.stringify(request));
  }

  requestMapElementIdsByRadius(radius) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RetrieveMapElementIdsByRadius',
      radius,
    }));
  }

  changeHasMap(hasMap) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'SendHdmapStatus',
      value: hasMap,
    }));
  }

  requestRoute(start, start_heading, waypoint, end, parkingInfo) {
    const request = {
      type: 'SendRoutingRequest',
      start,
      end,
      waypoint,
    };

    if (parkingInfo) {
      request.parkingInfo = parkingInfo;
    }

    if (start_heading) {
      request.start.heading = start_heading;
    }
    this.websocket && this.websocket.send(JSON.stringify(request));
  }

  requestDefaultCycleRouting(start, start_heading, waypoint, end, cycleNumber) {
    const request = {
      type: 'SendDefaultCycleRoutingRequest',
      start,
      end,
      waypoint,
      cycleNumber,
    };
    if (start_heading) {
      request.start.heading = start_heading;
    }
    this.websocket && this.websocket.send(JSON.stringify(request));
  }

  requestDefaultRoutingEndPoint() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'GetDefaultEndPoint',
    }));
  }

  requestDefaultRoutingPoints() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'GetDefaultRoutings',
    }));
  }

  requestParkingRoutingDistance() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'GetParkingRoutingDistance',
    }));
  }

  resetBackend() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'Reset',
    }));
  }

  dumpMessages() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'Dump',
    }));
  }

  changeSetupMode(mode) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_MODE',
      value: mode,
    }));
  }

  changeMap(map) {
    if (!map || map === 'NONE') {return;}
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_MAP',
      value: map,
    }));
    this.updatePOI = true;
    this.updateDefaultRoutingPoints = true;
  }

  changeVehicle(vehicle) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_VEHICLE',
      value: vehicle,
    }));
  }

  loadLoocalScenarioSets() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'LOAD_SCENARIOS',
    }));
  }

  /**
   *
   * @param scenarioId string
   */
  changeScenario(scenarioId) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_SCENARIO',
      value: scenarioId,
    }));
  }

  /**
   *
   * @param scenarioSetId string
   */
  changeScenarioSet(scenarioSetId) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_SCENARIO_SET',
      value: scenarioSetId,
    }));

    // 切换场景集后，需要重新置空当前场景
    this.changeScenario('');
  }

  deleteScenarioSet(scenarioSetId) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'DELETE_SCENARIO_SET',
      value: scenarioSetId,
    }));
  }

  getDymaticModelList() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'LOAD_DYNAMIC_MODELS',
    }));
  }

  changeDynamicModel(model) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_DYNAMIC_MODEL',
      value: model,
    }));
  }

  switchToDefaultDynamicModel() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_DYNAMIC_MODEL',
      value: 'Simulation Perfect Control',
    }));
  }

  switchToVirtualCloseLoopModel() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_DYNAMIC_MODEL',
      value: 'Virtual Close Loop',
    }));
  }

  switchToCloseLoopModel() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'CHANGE_DYNAMIC_MODEL',
      value: 'Close Loop',
    }));
  }

  deleteDynamicModels(dynamicModelId) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: 'DELETE_DYNAMIC_MODEL',
      value: dynamicModelId,
    }));
  }

  // 加载本地records
  loadLocalRecords() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action:'LOAD_RECORDS',
    }));
  }

  // 选择本地records
  changeRecord(recordId) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action:'CHANGE_RECORD',
      value: recordId,
    }));
  }

  // 删除本地record
  deleteRecord(recordId) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action:'DELETE_RECORD',
      value: recordId,
    }));
  }

  // 停止本地record播放
  stopRecord() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action:'STOP_RECORD',
    }));
  }
  executeModeCommand(action) {
    if (!['SETUP_MODE', 'RESET_MODE', 'ENTER_AUTO_MODE'].includes(action)) {
      console.error('Unknown mode command found:', action);
      return;
    }

    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action,
    }));

    setTimeout(this.requestHmiStatus, 5000);
  }

  executeModuleCommand(moduleName, command) {
    if (!['START_MODULE', 'STOP_MODULE'].includes(command)) {
      console.error('Unknown module command found:', command);
      return;
    }

    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIAction',
      action: command,
      value: moduleName,
    }));

    setTimeout(this.requestHmiStatus, 5000);
  }

  submitDriveEvent(eventTimeMs, eventMessage, eventTypes, isReportable) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'SubmitDriveEvent',
      event_time_ms: eventTimeMs,
      event_msg: eventMessage,
      event_type: eventTypes,
      is_reportable: isReportable,
    }));
  }

  submitAudioEvent(eventTimeMs, obstacleId, audioType, movingResult, direction, isSirenOn) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'SubmitAudioEvent',
      event_time_ms: eventTimeMs,
      obstacle_id: obstacleId,
      audio_type: audioType,
      moving_result: movingResult,
      audio_direction: direction,
      is_siren_on: isSirenOn,
    }));
  }

  toggleSimControl(enable) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'ToggleSimControl',
      enable,
    }));
  }

  requestRoutePath() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RequestRoutePath',
    }));
  }

  requestHmiStatus() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'HMIStatus',
    }));
  }

  publishNavigationInfo(data) {
    this.websocket && this.websocket.send(data);
  }

  requestDataCollectionProgress() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RequestDataCollectionProgress',
    }));
  }

  setPointCloudWS(pointcloudws) {
    this.pointcloudWS = pointcloudws;
  }

  saveDefaultRouting(routingName, points) {
    const request = {
      type: 'SaveDefaultRouting',
      name: routingName,
      point: points,
      routingType: 'defaultRouting',
    };
    this.websocket && this.websocket.send(JSON.stringify(request));
  }

  requestPreprocessProgress() {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RequestPreprocessProgress',
    }));
  }

  startPreprocessData(data, type) {
    const request = {
      type,
    };
    if (data) {
      request.data = data;
    }
    this.websocket && this.websocket.send(JSON.stringify(request));
  }

  sendParkingRequest(
    start,
    waypoint,
    end,
    parkingInfo,
    laneWidth,
    cornerPoints,
    id,
    start_heading
  ) {
    const request = {
      type: 'SendParkingRoutingRequest',
      start,
      end,
      waypoint,
      parkingInfo,
      laneWidth,
      cornerPoints,
    };
    if (start_heading) {
      request.start.heading = start_heading;
    }
    if (id) {
      request.end.id = id;
    }
    this.websocket && this.websocket.send(JSON.stringify(request));
  }
}
