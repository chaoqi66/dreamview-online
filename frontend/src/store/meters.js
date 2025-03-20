import {
  observable, computed, action, runInAction,
} from 'mobx';
import * as THREE from 'three';
import STORE from 'store';
import { message } from 'antd';

function roundToTens(percent) {
  return Math.round(percent / 10.0) * 10;
}

function toDrivingMode(disengageType) {
  switch (disengageType) {
    case 'DISENGAGE_MANUAL':
      return 'MANUAL';
    case 'DISENGAGE_NONE':
      return 'AUTO';
    case 'DISENGAGE_EMERGENCY':
      return 'DISENGAGED';
    case 'DISENGAGE_AUTO_STEER_ONLY':
      return 'AUTO STEER';
    case 'DISENGAGE_AUTO_SPEED_ONLY':
      return 'AUTO SPEED';
    case 'DISENGAGE_CHASSIS_ERROR':
      return 'CHASSIS ERROR';
    default:
      return 'UNKNOWN';
  }
}

function toNewDrivingMode(drivingMode) {
  switch (drivingMode) {
    case 'COMPLETE_AUTO_DRIVE':
      return 'AUTO';
    case 'COMPLETE_MANUAL':
      return 'MANUAL';
    case 'AUTO_STEER_ONLY':
      return 'STEER';
    case 'AUTO_SPEED_ONLY':
      return 'SPEED';
    default:
      return 'UNKNOWN';
  }
}

function isAutoMode(disengageType) {
  return disengageType === 'DISENGAGE_NONE'
           || disengageType === 'DISENGAGE_AUTO_STEER_ONLY'
           || disengageType === 'DISENGAGE_AUTO_SPEED_ONLY';
}

function isNewAutoMode(drivingMode) {
  return drivingMode === 'COMPLETE_AUTO_DRIVE'
           || drivingMode === 'AUTO_STEER_ONLY'
           || drivingMode === 'AUTO_SPEED_ONLY';
}

function meterPerSecondToKmPerHour(speed) {
  return Math.round(speed * 3600 / 1000.0);
}

export default class Meters {
    @observable throttlePercent = 0;

    @observable brakePercent = 0;

    @observable acceleration = 0;

    @observable speed = 0;

    @observable steeringAngle = 0;

    @observable steeringAngleRad = 0;

    @observable steeringPercentage = 0;

    @observable leftTurnSignal = false;

    @observable rightTurnSignal = false;

    @observable batteryPercentage = null;

    @observable gearLocation = '';

    @observable drivingMode = 'UNKNOWN';

    @observable newDrivingMode = 'UNKNOWN';

    @observable chassisDrivingMode = 'UNKNOWN';

    @observable disengageType = 'UNKNOWN';

    @observable isAutoMode = false;

    @observable isNewAutoMode = false;

    @observable turnSignal = '';

    @observable drivingAction = '';

    @observable trafficLightSign = null;

    @observable timestampSec = '';

    @observable version = '';

    @observable locQuality = '';

    @observable rtkStatus = '';

    @observable expectationSpeed = '';

    @observable humanLanePreference = '';

    @observable realtimeMessageSize = 0;

    @observable realtimeStamp = 0;

    @observable mapMessageSize = 0;

    @observable objectNew = null;

    @observable predictionObstacle = null;

    @observable predictionObstacleId = null;

    @observable effLaneIndex = null;

    @observable selectEfficientLaneSequence = null;

    @observable selectEgoPathProposal = null;

    @observable planningEgoPath = null;

    @observable efficientLaneSequenceMaxIndex = null;

    @observable effLaneMaxSelect = false;

    @observable effLaneSinglePath = false;

    @observable postTbtInfos = null;

    @observable postGoalInfos = null;

    @observable deltaTime1 = null;

    @observable deltaTime2 = null;

    @observable deltaTime1_point_cloud = { pcd: '' };

    @observable deltaTime2_point_cloud = { pcd: '' };

    @observable channelTimeStamp = {};

    @observable cyberTimestamp = null;

    @observable timestampTimeDiff = null;

    @observable enterObstacleId = null;

    @observable useHdmap = '';

    @observable mapMode = '';

    @observable mapFile = '';

    @observable steeringTorqueNm = 0;

    @observable laneLightSet = [];

    @observable trafficLightFused = null;

    @observable curBin = 0;

    @observable pncReferenceLane = 'NORMAL';

    @observable tripId = '';

    @observable quickDataRecordUrl = '';

    @observable distanceList = [];

    @observable issueDetail = null;

    @observable motorTorque = '';

    @observable lanemapMapfreeSwitchMode = 'lanemap';

    @observable multiFrameLane = {
      start: 0,
      end: 60
    };

    @observable faultReport = [];

    @observable autoFaultReport = true;

    // 0:UNKNOWN 1: yes 2: no
    @observable humanIntervention = 0;

    @observable tripDetail = null;

    @observable behaviorMap = {};

    @observable behaviorMapSwitch = {
      lanePreferSwitch: {},
      pathByLaneSwitch: {},
      speedLimitByLaneSwitch: {},
    };

    @observable nnPathSwitch = {};

    @observable nnPathList = [];

    @observable pncPreList = [];

    @observable channelsFrequency = [];

    @observable autoRange = 30;

    @observable roadPointSize = 0.2;

    @observable historyData = null;

    @observable naviLength = '';

    @observable correctionType = '';

    @observable selectEgoPathProposalIndex = 0;

    @action update(world) {
      if (world.autoDrivingCar) {
        if (world.autoDrivingCar.throttlePercentage !== undefined) {
          this.throttlePercent = world.autoDrivingCar.throttlePercentage;
        }
        if (world.autoDrivingCar.brakePercentage !== undefined) {
          this.brakePercent = roundToTens(world.autoDrivingCar.brakePercentage);
        }

        this.steeringTorqueNm = world.autoDrivingCar?.steeringTorqueNm;

        this.motorTorque = world.autoDrivingCar?.steeringMotorTorqueNm;

        if (world.autoDrivingCar.acceleration !== undefined) {
          this.acceleration = world.autoDrivingCar.acceleration.toFixed(2);
        }

        if (world.autoDrivingCar.speed !== undefined) {
          // Convert the unit from m/s to mph.
          this.speed = world.autoDrivingCar.speed;
        }

        if (world.autoDrivingCar.batteryPercentage !== undefined
                && world.autoDrivingCar.batteryPercentage >= 0
                && world.autoDrivingCar.batteryPercentage <= 100) {
          this.batteryPercentage = world.autoDrivingCar.batteryPercentage;
        }

        if (world.autoDrivingCar.gearLocation !== undefined) {
          this.gearLocation = world.autoDrivingCar.gearLocation;
        }

        if (world.autoDrivingCar.steeringPercentage !== undefined
                && !isNaN(world.autoDrivingCar.steeringPercentage)) {
          this.steeringPercentage = Math.round(world.autoDrivingCar.steeringPercentage);
        }

        if (world.autoDrivingCar.steeringAngle !== undefined
                && !isNaN(world.autoDrivingCar.steeringAngle)) {
          this.steeringAngle = -Math.round(
            world.autoDrivingCar.steeringAngle * 180.0 / Math.PI,
          );
        }

        if (world.autoDrivingCar && world.autoDrivingCar.steeringAngleRad && !isNaN(world.autoDrivingCar.steeringAngleRad)) {
          this.steeringAngleRad = Math.round(
            world.autoDrivingCar.steeringAngleRad * 180.0 / Math.PI,
          );
        }

        if (STORE.options.showVirtualChassis) {
          this.rightTurnSignal = world.virtualCar?.rightTurnSignal;
          this.leftTurnSignal = world.virtualCar?.leftTurnSignal;
        } else {
          this.rightTurnSignal = world.autoDrivingCar?.rightTurnSignal;
          this.leftTurnSignal = world.autoDrivingCar?.leftTurnSignal;
        }

        if (world.autoDrivingCar.disengageType !== undefined) {
          this.drivingMode = toDrivingMode(world.autoDrivingCar.disengageType);
          this.isAutoMode = isAutoMode(world.autoDrivingCar.disengageType);
          this.disengageType = world.autoDrivingCar.disengageType;
        }

        if (world.autoDrivingCar.currentSignal !== undefined) {
          this.turnSignal = world.autoDrivingCar.currentSignal;
        }

        if (world.autoDrivingCar.chassisDrivingMode !== undefined) {
          this.chassisDrivingMode = world.autoDrivingCar.chassisDrivingMode;
          this.newDrivingMode = toNewDrivingMode(world.autoDrivingCar.chassisDrivingMode);
          this.isNewAutoMode = isNewAutoMode(world.autoDrivingCar.chassisDrivingMode);
          // if (['COMPLETE_AUTO_DRIVE', 'AUTO_STEER_ONLY', 'AUTO_SPEED_ONLY'].includes(this.chassisDrivingMode) &&
          //   world?.controlData?.bigTurnStatus === false &&
          //   Math.abs(this.steeringTorqueNm - this.motorTorque) > 1
          // ) {
          //   this.humanIntervention = 1;
          // } else {
          //   this.humanIntervention = 2;
          // }
          // if (world?.controlData?.bigTurnStatus === true || this.chassisDrivingMode === 'COMPLETE_MANUAL') {
          //   this.humanIntervention = 0;
          // }
          if (world?.controlData?.dvLatCorrectionHappened === true || this.chassisDrivingMode === 'COMPLETE_MANUAL') {
            this.humanIntervention = 1;
          } else {
            this.humanIntervention = 2;
          }
        }

        if (world.drivingAction !== undefined) {
          this.drivingAction = world.drivingAction;
        }

        if (world.trafficLightSign !== undefined) {
          this.trafficLightSign = world.trafficLightSign;
        }

        if (world.autoDrivingCar.timestampSec !== undefined) {
          this.timestampSec = world.autoDrivingCar.timestampSec;
        }

        if (world.version !== undefined) {
          this.version = world.version;
        }

        if (world.locQuality !== undefined) {
          this.locQuality = world.locQuality;
        }

        if (world.rtkStatus !== undefined) {
          this.rtkStatus = world.rtkStatus;
        }

        if (world.expectationSpeed !== undefined) {
          this.expectationSpeed = world.expectationSpeed;
        }

        if (world.humanLanePreference !== undefined) {
          this.humanLanePreference = world.humanLanePreference;
        }
      }

      if (world.objectNew) {
        this.objectNew = world.objectNew;
      }

      if (world.objectPredicted) {
        const objectFusionPredicted = world.objectPredicted && world.objectPredicted?.objectFusion;
        if (objectFusionPredicted) {
          this.predictionObstacle = objectFusionPredicted.find(item => item.id === this.predictionObstacleId);
        }
      }

      if (world.efficientLaneChange && world.efficientLaneChange.efficientLaneSequence) {
        let efficientLaneSequence = world.efficientLaneChange.efficientLaneSequence;
        if (this.effLaneMaxSelect) {
          // efficientLaneSequence = efficientLaneSequence.filter((item, index) => item.egoPathPoint);
          if (efficientLaneSequence.length === 1) {
            this.selectEfficientLaneSequence = efficientLaneSequence[0];
            this.efficientLaneSequenceMaxIndex = 0;
          } else {
            efficientLaneSequence = efficientLaneSequence.filter((i, index) => index !== 0);
            const { maxObject, maxIndex } = efficientLaneSequence.reduce((acc, currentObject, currentIndex, array) => {
              if (acc.maxObject === null || currentObject.probability > acc.maxObject.probability) {
                return { maxObject: currentObject, maxIndex: currentIndex };
              } else {
                return acc;
              }
            }, { maxObject: null, maxIndex: -1 });
            if (maxObject) {
              this.selectEfficientLaneSequence = maxObject;
              this.efficientLaneSequenceMaxIndex = maxIndex + 1;
            }
          }
        } else {
          if (typeof this.effLaneIndex === 'number') {
            const efficientLaneSequenceObj = efficientLaneSequence[this.effLaneIndex] || {};
            efficientLaneSequenceObj.selected = true;
            this.selectEfficientLaneSequence = efficientLaneSequenceObj;
          } else {
            this.selectEfficientLaneSequence = null;
          }
        }
      }

      if (world.efficientLaneChange && world.efficientLaneChange.postTbtInfos) {
        this.postTbtInfos = world.efficientLaneChange.postTbtInfos;
      }

      if (world.efficientLaneChange && world.efficientLaneChange.postGoalInfos) {
        this.postGoalInfos = world.efficientLaneChange.postGoalInfos;
      }

      this.planningEgoPath = world?.egoPathProposalSet?.planningEgoPath || {};

      if (world.egoPathProposalSet && world.egoPathProposalSet.egoPathProposals) {
        if (this.planningEgoPath.pathIndex >= 0) {
          this.selectEgoPathProposal = world.egoPathProposalSet.egoPathProposals[this.planningEgoPath.pathIndex];
          this.selectEgoPathProposalIndex = this.planningEgoPath.pathIndex;
        } else {
          const { maxScoreObject, maxScoreIndex } = world.egoPathProposalSet.egoPathProposals.reduce(
            (acc, current, index) => {
              if (!acc.maxScoreObject || current.score > acc.maxScoreObject.score) {
                acc.maxScoreObject = current;
                acc.maxScoreIndex = index;
              }
              return acc;
            },
            { maxScoreObject: null, maxScoreIndex: -1 } // 初始值
          );

          this.selectEgoPathProposal = maxScoreObject;
          this.selectEgoPathProposalIndex = maxScoreIndex;
        }
      }

      if (world.deltaTime1) {
        this.deltaTime1 = world.deltaTime1;
      }

      this.channelTimeStamp = world?.channelTimeStamp || {};

      if (world.deltaTime2) {
        this.deltaTime2 = world.deltaTime2;
      }

      if (world.autoDrivingCar) {
        this.cyberTimestamp = world.timestamp;
      }

      if (world.timestampTimeDiff) {
        this.timestampTimeDiff = world.timestampTimeDiff;
      }

      if (world.referenceLane && world.referenceLane.length) {
        const fallback = world.referenceLane.some(item => item.fallback && item.inUse);
        if (fallback) {
          this.pncReferenceLane = 'FALLBACK';
        } else {
          this.pncReferenceLane = 'NORMAL';
        }
      }

      if (world.useHdmap) {
        const hdmap = sessionStorage.getItem('useHdmap');
        this.useHdmap = hdmap ? hdmap : world.useHdmap;
      }
      if (world.mapMode) {
        const mapModeObj = {
          'with_hdmap': 'hdmap',
          'no_hdmap':'mapless',
        };
        this.mapMode = mapModeObj[world.mapMode];
      }
      this.mapFile = world?.mapFile;

      this.lanemapMapfreeSwitchMode = world?.lanemapMapfreeSwitchMode;

      this.laneLightSet = world?.roadStructure?.laneLightSet || [];

      this.trafficLightFused = world?.trafficLightFused;

      this.faultReport = world?.faultReports?.faultReport || [];
      if (this.faultReport.length && this.faultReport.some(f => f.faultCode === 18001)) {
        message.info('即将抵达终点');
      }

      this.behaviorMap = world?.behaviors || {};

      this.channelsFrequency = world?.channelFrequencyReport?.channelsFrequency || [];

      if (world.egoPathProposalSet && world.egoPathProposalSet.egoPathProposals && world.egoPathProposalSet.egoPathProposals.length) {
        this.nnPathList = world?.egoPathProposalSet?.egoPathProposals || [];
        world.egoPathProposalSet.egoPathProposals.forEach((item, index) => {
          if (this.nnPathSwitch[index] === undefined) {
            this.nnPathSwitch[index] = true;
          }
        });
      }

      this.naviLength = world?.naviLength ?? '';

      this.correctionType = world?.controlData?.correctionType || '';
    }

    @action updateCurBin(bin) {
      this.curBin = bin;
    }

    @action updateStatus(newVal) {
      if (newVal.deltaTime1_point_cloud) {
        this.deltaTime1_point_cloud = newVal.deltaTime1_point_cloud;
      }
      if (newVal.deltaTime2_point_cloud) {
        this.deltaTime2_point_cloud = newVal.deltaTime2_point_cloud;
      }
    }

    @action updateRealtimeMessageSize(messageSize) {
      this.realtimeMessageSize = messageSize;
    }

    @action updateRealtimeStamp(timeStamp) {
      this.realtimeStamp = timeStamp;
    }

    @action updateMapMessageSize(messageSize) {
      this.mapMessageSize = messageSize;
    }

    @action updateEnterObstacleId(obstacleId) {
      this.enterObstacleId = obstacleId + '';
    }

    @action updatePredictionObstacleId(obstacleId) {
      this.predictionObstacleId = obstacleId + '';
    }

    @action updateEffLaneIndex(index) {
      if (index === '') {
        this.effLaneIndex = null;
      } else {
        this.effLaneIndex = Number(index);
      }
    }

    @action updateMultiFrameLane(start, end) {
      start && (this.multiFrameLane.start = start);
      end && (this.multiFrameLane.end = end);
    }

    @action updateEffLaneMax(isMax) {
      this.effLaneMaxSelect = isMax;
    }
    @action updateEffLaneSinglePath(isSinglePath) {
      this.effLaneSinglePath = isSinglePath;
    }

    @action updateTripId(id) {
      this.tripId = id;
    }

    @action updateQuickDataRecordUrl(url) {
      this.quickDataRecordUrl = url;
    }

    @action updateDistanceList(list) {
      this.distanceList = list;
    }

    @action updateIssueDetail(issueDetail) {
      this.issueDetail = issueDetail;
    }

    @action updateTripDetail(tripDetail) {
      this.tripDetail = tripDetail;
    }

    @action updateAutoFaultReport(autoFaultReport) {
      this.autoFaultReport = autoFaultReport;
    }

    @action updateBehaviorMapSwitch(obj, type) {
      if (type === '0') {
        this.behaviorMapSwitch.lanePreferSwitch = { ...this.behaviorMapSwitch.lanePreferSwitch, ...obj };
      }
      if (type === '1') {
        this.behaviorMapSwitch.pathByLaneSwitch = { ...this.behaviorMapSwitch.pathByLaneSwitch, ...obj };
      }
      if (type === '2') {
        this.behaviorMapSwitch.speedLimitByLaneSwitch = { ...this.behaviorMapSwitch.speedLimitByLaneSwitch, ...obj };
      }
    }

    @action updateNnPathSwitch(obj) {
      this.nnPathSwitch = { ...this.nnPathSwitch, ...obj };
    }

    @action updatePncPreList(pncPreList) {
      this.pncPreList = pncPreList;
    }

    @action updateAutoRange(range) {
      this.autoRange = range;
    }

    @action updateRoadPointSize(size) {
      this.roadPointSize = size;
    }

    @action saveHistoryData(history) {
      this.historyData = history;
    }
}

