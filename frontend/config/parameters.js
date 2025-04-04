module.exports = {
  camera: {
    viewAngle: 0.8,
    Default: {
      fov: 60,
      near: 1,
      far: 300,
    },
    Near: {
      fov: 60,
      near: 1,
      far: 200,
    },
    Overhead: {
      fov: 60,
      near: 1,
      far: 100,
    },
    Map: {
      fov: 70,
      near: 1,
      far: 4000,
    },
    CameraView: {
      fov: 30.5,
      near: 1,
      far: 1500,
    },
    Orthographic: {
      fov: 70,
      near: 1,
      far: 4000,
    },
    laneWidth: 4.5,
    laneWidthToViewDistanceRatio: 5,
  },
  ground: {
    defaults: {
      mpp: 0.125,
      xres: 8192,
      yres: 8192,
      xorigin: 4096,
      yorigin: 4096,
      type: 'default',
      tileRange: 4,
    },
    sunnyvale_big_loop: {
      mpp: 0.125,
      xres: 24576,
      yres: 16384,
      xorigin: 587392,
      yorigin: 4140800,
      type: 'default',
      tileRange: 4,
    },
  },
  planning: {
    minInterval: 0.1,
    defaults: {
      width: 1.4,
    },
    pathProperties: {
      default: {
        width: 0.1,
        color: 16764501,
        opacity: 1,
        zOffset: 1.4,
      },
      trajectory: {
        width: 0.8,
        color: 119233,
        opacity: 0.65,
        zOffset: 1,
      },
      planning_reference_line: {
        width: 0.6,
        color: 14177878,
        opacity: 0.7,
        zOffset: 1.1,
      },
      DpPolyPathOptimizer: {
        width: 0.4,
        color: 9305268,
        opacity: 0.8,
        zOffset: 1.2,
      },
      PIECEWISE_JERK_PATH_OPTIMIZER: {
        width: 0.2,
        color: 3580651,
        opacity: 1,
        zOffset: 1.3,
      },
      planning_path_boundary_1: {
        style: 'dash',
        width: 0.1,
        color: 15793920,
        opacity: 1,
        zOffset: 1.3,
      },
      planning_path_boundary_2: {
        style: 'dash',
        width: 0.1,
        color: 15793920,
        opacity: 1,
        zOffset: 1.3,
      },
    },
  },
  options: {
    showTasks: {
      default: true,
    },
    showModuleController: {
      default: false,
    },
    showMenu: {
      default: false,
    },
    showRouteEditingBar: {
      default: false,
    },
    showPOI: {
      default: false,
    },
    showDataRecorder: {
      default: false,
    },
    showPNCMonitor: {
      default: false,
    },
    showPredictionMonitor: {
      default: false
    },
    showEfficientLaneMonitor: {
      default: false
    },
    showRoadNetProposals: {
      default: false,
    },
    selectPNCMonitorTab: {
      default: 0
    },
    showPNCPlanningPanel: {
      default: false
    },
    showPNCControlPanel: {
      default: false
    },
    showPlanningStatusPanel: {
      default: true
    },
    showOperator: {
      default: false
    },
    showSideBar: {
      default: true
    },
    showTools: {
      default: true
    },
    showTimestamp: {
      default: true
    },
    cameraDraggable: {
      default: false
    },
    showDataCollectionMonitor: {
      default: false,
    },
    showFuelClient: {
      default: false,
    },
    enableSimControl: {
      default: false,
    },
    lockTaskPanel: {
      default: false,
    },
    showVideo: {
      default: false,
    },
    showConsoleTeleopMonitor: {
      default: false,
    },
    showCarTeleopMonitor: {
      default: false,
    },
    cameraAngle: {
      default: 'Default',
      hasCameraView: false,
    },
    showDecisionMain: {
      default: true,
      menuId: 'decisionMain',
    },
    showDecisionObstacle: {
      default: true,
      menuId: 'decisionObstacle',
    },
    showPlanningTrajectory: {
      default: true,
      menuId: 'planningTrajectory',
    },
    showPlanningCar: {
      default: false,
      menuId: 'planningCar',
    },
    showPlanningRSSInfo: {
      default: false,
      menuId: 'rssInfo',
    },
    showRouting: {
      default: true,
      menuId: 'routing',
    },
    showPredictionMajor: {
      default: true,
      menuId: 'predictionMajor',
    },
    showPredictionMinor: {
      default: true,
      menuId: 'predictionMinor',
    },
    showGaussianInfo: {
      default: false,
      menuId: 'predictionGaussianInfo',
    },
    showPredictionPriority: {
      default: true,
      menuId: 'predictionPriority',
    },
    showPredictionInteractiveTag: {
      default: true,
      menuId: 'predictionInteractiveTag',
    },
    showPointCloud: {
      default: false,
      menuId: 'perceptionPointCloud',
    },
    showPerceptionObjectTopic: {
      default: false,
      menuId: 'perceptionObjectTopic',
    },
    showPerceptionTypeStaticUnkonwn: {
      default: false,
      menuId: 'perceptionTypeStaticUnkonwn',
    },
    showPerceptionLaneMarker: {
      default: false,
      menuId: 'perceptionLaneMarker',
    },
    showObstaclesVehicle: {
      default: true,
      menuId: 'perceptionVehicle',
    },
    showObstaclesPedestrian: {
      default: true,
      menuId: 'perceptionPedestrian',
    },
    showObstaclesBicycle: {
      default: true,
      menuId: 'perceptionBicycle',
    },
    showObstaclesUnknownMovable: {
      default: true,
      menuId: 'perceptionUnknownMovable',
    },
    showObstaclesUnknownUnmovable: {
      default: true,
      menuId: 'perceptionUnknownUnmovable',
    },
    showObstaclesUnknown: {
      default: true,
      menuId: 'perceptionUnknown',
    },
    showObstaclesVirtual: {
      default: false,
      menuId: 'perceptionVirtual',
    },
    showObstaclesCipv: {
      default: true,
      menuId: 'perceptionCipv',
    },
    showObstaclesVelocity: {
      default: true,
      menuId: 'perceptionVelocity',
    },
    showObstaclesHeading: {
      default: true,
      menuId: 'perceptionHeading',
    },
    showObstaclesId: {
      default: true,
      menuId: 'perceptionId',
    },
    showObstaclesInfo: {
      default: true,
      menuId: 'perceptionObstacleInfo',
    },
    showObstaclesLidarSensor: {
      default: false,
      menuId: 'perceptionLidarSensor',
    },
    showObstaclesRadarSensor: {
      default: false,
      menuId: 'perceptionRadarSensor',
    },
    showObstaclesCameraSensor: {
      default: false,
      menuId: 'perceptionCameraSensor',
    },
    showObstaclesV2xInfo: {
      default: false,
      menuId: 'perceptionV2xInfo',
    },
    showObstaclesPostFusionObject: {
      default: true,
      menuId: 'showObstaclesPostFusionObject',
    },
    showObstaclesBevObject: {
      default: false,
      menuId: 'showObstaclesBevObject',
    },
    showObstaclesPvFmNarrowObject: {
      default: false,
      menuId: 'showObstaclesPvFmNarrowObject',
    },
    showObstaclesPvFmWideObject: {
      default: false,
      menuId: 'showObstaclesPvFmWideObject',
    },
    showObstaclesPvLbPinholeObject: {
      default: false,
      menuId: 'showObstaclesPvLbPinholeObject',
    },
    showObstaclesPvRbPinholeObject: {
      default: false,
      menuId: 'showObstaclesPvRbPinholeObject',
    },
    showObstaclesPvFmFisheyeObject: {
      default: false,
      menuId: 'showObstaclesPvFmFisheyeObject',
    },
    showObstaclesPvLmFisheyeObject: {
      default: false,
      menuId: 'showObstaclesPvLmFisheyeObject',
    },
    showObstaclesPvRmFisheyeObject: {
      default: false,
      menuId: 'showObstaclesPvRmFisheyeObject',
    },
    showObstaclesPvBmFisheyeObject: {
      default: false,
      menuId: 'showObstaclesPvBmFisheyeObject',
    },
    showObstaclesBevPostObject: {
      default: false,
      menuId: 'showObstaclesBevPostObject',
    },
    showObstaclesPvPostFmNarrowObject: {
      default: false,
      menuId: 'showObstaclesPvPostFmNarrowObject',
    },
    showObstaclesPvPostFmWideObject: {
      default: false,
      menuId: 'showObstaclesPvPostFmWideObject',
    },
    showObstaclesPvPostLbPinholeObject: {
      default: false,
      menuId: 'showObstaclesPvPostLbPinholeObject',
    },
    showObstaclesPvPostRbPinholeObject: {
      default: false,
      menuId: 'showObstaclesPvPostRbPinholeObject',
    },
    showObstaclesOccupancyObject: {
      default: false,
      menuId: 'showObstaclesOccupancyObject',
    },
    showPositionGps: {
      default: false,
      menuId: 'positionGps',
    },
    showPositionLocalization: {
      default: true,
      menuId: 'positionLocalization',
    },
    showVirtualChassis: {
      default: false,
      menuId: 'virtualChassis',
    },
    showPositionCloseLoop: {
      default: true,
      menuId: 'positionCloseLoop',
    },
    showPositionShadow: {
      default: false,
      menuId: 'positionShadow',
    },
    showMapCrosswalk: {
      default: true,
      menuId: 'mapCrosswalk',
    },
    showMapClearArea: {
      default: true,
      menuId: 'mapClearArea',
    },
    showMapJunction: {
      default: false,
      menuId: 'mapJunction',
    },
    showMapPncJunction: {
      default: false,
      menuId: 'mapPncJunction',
    },
    showMapLane: {
      default: true,
      menuId: 'mapLane',
    },
    showMapRoad: {
      default: false,
      menuId: 'mapRoad',
    },
    showMapSignal: {
      default: true,
      menuId: 'mapSignal',
    },
    showMapStopSign: {
      default: true,
      menuId: 'mapStopSign',
    },
    showMapYield: {
      default: true,
      menuId: 'mapYield',
    },
    showMapSpeedBump: {
      default: true,
      menuId: 'mapSpeedBump',
    },
    showMapParkingSpace: {
      default: true,
      menuId: 'mapParkingSpace',
    },
    showMapLaneId: {
      default: false,
      menuId: 'mapLaneId',
    },
    showDefaultRoutingInput: {
      default: false,
    },
    showCycleNumberInput: {
      default: false,
    },
  },
  routingEditor: {
    radiusOfMapRequest: 2000,
  },
  navigation: {
    map: 'BaiduMap',
    mapAPiUrl: 'https://api.map.baidu.com/api?v=3.0&ak=0kKZnWWhXEPfzIkklmzAa3dZ&callback=initMap',
  },
  debug: {
    autoMonitorMessage: false,
    performanceMonitor: false,
  },
  server: {
    port: 8888,
  },
};
