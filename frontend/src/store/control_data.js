import { action, observable, toJS } from 'mobx';
import { LinearInterpolant, EllipseCurve } from 'three';
import STORE from 'store';
import { roundNumber } from 'utils/misc';

const MAX_HISTORY_POINTS = 20;

export default class ControlData {
    @observable lastUpdatedTime = null;

    data = this.initData();

    @action updateTime(newTime) {
      this.lastUpdatedTime = newTime;
    }

    initData() {
      return {
        trajectoryGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
          steerCurve: [],
          currentTargetPoint: [],
        },
        pose: { x: null, y: null, heading: null },
        speedGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
        },
        curvatureGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
        },
        accelerationGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
        },
        stationErrorGraph: {
          error: [],
        },
        headingErrorGraph: {
          error: [],
        },
        lateralErrorGraph: {
          error: [],
        },
        realSpeedGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
        },
        realAccelerationGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
        },
        realAngleGraph: {
          plan: [],
          target: [],
          real: [],
          autoModeZone: [],
        },
      };
    }

    updateErrorGraph(graph, currentTimestamp, error) {
      if (!error || !currentTimestamp || !graph) {
        return;
      }

      // clean up data if needed
      const removeAllPoints = graph.error.length > 0
            && currentTimestamp < graph.error[graph.error.length - 1].x;
      const removeOldestPoint = (graph.error.length >= MAX_HISTORY_POINTS);
      if (removeAllPoints) {
        graph.error = [];
      } else if (removeOldestPoint) {
        graph.error.shift();
      }

      // add new data
      const hasNewData = graph.error.length === 0
            || currentTimestamp !== graph.error[graph.error.length - 1].x;
      if (hasNewData) {
        graph.error.push({ x: currentTimestamp, y: error });
      }
    }

    updateSteerCurve(graph, adc, vehicleParam) {
      const steeringAngle = adc.steeringAngle / vehicleParam.steerRatio;
      let R = null;
      if (Math.abs(Math.tan(steeringAngle)) > 0.0001) {
        R = vehicleParam.wheelBase / Math.tan(steeringAngle);
      } else {
        R = 100000;
      }

      const heading = adc.heading;
      const radius = Math.abs(R);
      const lengthAngle = 7200 / (2 * Math.PI * radius) * Math.PI / 180;
      let theta1 = null;
      let theta2 = null;
      let centerangle = null;
      let startangle = null;
      if (R >= 0) {
        centerangle = Math.PI / 2 + heading;
        startangle = (heading - Math.PI / 2);
        theta1 = 0;
        theta2 = lengthAngle;
      } else {
        centerangle = heading - Math.PI / 2;
        startangle = (Math.PI / 2 + heading);
        theta1 = -lengthAngle;
        theta2 = 0;
      }

      const centerx = adc.positionX + Math.cos(centerangle) * radius;
      const centery = adc.positionY + Math.sin(centerangle) * radius;

      const aClockwise = false;
      const curve = new EllipseCurve( // all in radians
        centerx, centery,
        radius, radius,
        theta1, theta2,
        aClockwise,
        startangle,
      );

      graph.steerCurve = curve.getPoints(25);
    }

    interpolateValueByCurrentTime(trajectory, currentTime, fieldName) {
      if (fieldName === 'timestampSec') {
        return currentTime;
      }
      const absoluteTimes = trajectory.map((point) => point.timestampSec);
      const plannedValues = trajectory.map((point) => point[fieldName]);
      const interpolant = new LinearInterpolant(absoluteTimes, plannedValues, 1, []);
      return interpolant.evaluate(currentTime)[0];
    }

    updateHistoryGraph() {
      const { historyData, cyberTimestamp } = STORE.meters;
      const realAngleGraph = this.data.realAngleGraph;
      const realSpeedGraph = this.data.realSpeedGraph;
      const realAccelerationGraph = this.data.realAccelerationGraph;
      if (historyData) {
        const { chassis } = toJS(historyData);
        const { controlBarInfo } = toJS(STORE.playback);
        const filteredData = {};
        for (let i = 0; i < controlBarInfo.length; i++) {
          const currentTimestamp = controlBarInfo[i].timestamp;
          const keys = Object.keys(chassis);
          for (let j = 0; j < keys.length; j++) {
            const key = parseInt(keys[j]);
            if (key === currentTimestamp) {
              filteredData[key] = chassis[key];
            }
          }
        }
        const xList = Object.keys(filteredData);
        const nowIndex = xList.findIndex(t => t / 1e9 >= cyberTimestamp);
        realAngleGraph.real = xList.map((t, i) => {
          return {
            x: i,
            y: Math.round(filteredData[t].steeringAngle * 180.0 / Math.PI)
          };
        });
        realSpeedGraph.real = xList.map((t, i) => {
          return {
            x: i,
            y: roundNumber(filteredData[t].speed, 2)
          };
        });
        realAccelerationGraph.real = xList.map((t, i) => {
          return {
            x: i,
            y: roundNumber(filteredData[t].acceleration, 2)
          };
        });
        realAngleGraph.now = [
          { x: nowIndex, y: -600 },
          { x: nowIndex, y: 600 },
        ];
        realSpeedGraph.now = [
          { x: nowIndex, y: -600 },
          { x: nowIndex, y: 600 },
        ];
        realAccelerationGraph.now = [
          { x: nowIndex, y: -600 },
          { x: nowIndex, y: 600 },
        ];
      }
    }

    updateAdcStatusGraph(graph, trajectory, adc, xFieldName, yFieldName, showIndex) {
      const currentTimestamp = adc.timestampSec;

      // clean up data if needed
      const removeAllPoints = graph.target.length > 0
            && currentTimestamp < graph.target[graph.target.length - 1].t;
      const removeOldestPoint = (graph.target.length >= MAX_HISTORY_POINTS);
      if (removeAllPoints) {
        graph.target = [];
        graph.real = [];
        graph.autoModeZone = [];
      } else if (removeOldestPoint) {
        graph.target.shift();
        graph.real.shift();
        graph.autoModeZone.shift();
      }

      const hasNewData = graph.target.length === 0
            || currentTimestamp !== graph.target[graph.target.length - 1].t;
      if (hasNewData) {
        // set planned data
        graph.plan = trajectory.map(
          (point) => ({ x: point[xFieldName], y: point[yFieldName] }));

        // add target value
        graph.target.push({
          x: this.interpolateValueByCurrentTime(
            trajectory, currentTimestamp, xFieldName,
          ),
          y: this.interpolateValueByCurrentTime(
            trajectory, currentTimestamp, yFieldName,
          ),
          t: currentTimestamp,
        });

        // add real value
        graph.real.push({ x: adc[xFieldName], y: adc[yFieldName] });
        if (showIndex) {
          graph.real.forEach((item, index) => {
            item.x = index - Math.min(MAX_HISTORY_POINTS - 1, (graph.real.length - 1));
          });
        }

        // add auto-mode indicator
        const isCompleteAuto = (adc.disengageType === 'DISENGAGE_NONE');
        graph.autoModeZone.push({
          x: adc[xFieldName],
          y: isCompleteAuto ? adc[yFieldName] : undefined,
        });
      }
    }

    setCurrentTargetPoint(graph, trajectoryPoint) {
      graph.currentTargetPoint = [];
      if (trajectoryPoint && trajectoryPoint.pathPoint) {
        graph.currentTargetPoint.push({
          x: trajectoryPoint.pathPoint.x,
          y: trajectoryPoint.pathPoint.y,
        });
      }
    }

    update(world, vehicleParam) {
      const trajectory = world.planningTrajectory;
      const adc = world.autoDrivingCar;
      if (adc.steeringAngleRad !== undefined && !isNaN(adc.steeringAngleRad)) {
        adc.angle = Math.round(
          world.autoDrivingCar.steeringAngleRad * 180.0 / Math.PI,
        );
      }

      if (trajectory && adc) {
        this.updateAdcStatusGraph(this.data.speedGraph,
          trajectory, adc, 'timestampSec', 'speed');
        this.updateAdcStatusGraph(this.data.accelerationGraph,
          trajectory, adc, 'timestampSec', 'acceleration');
        this.updateAdcStatusGraph(this.data.curvatureGraph,
          trajectory, adc, 'timestampSec', 'kappa');

        if (STORE.meters.historyData) {
          this.updateHistoryGraph(this.data.realAngleGraph);
        } else {
          this.updateAdcStatusGraph(this.data.realSpeedGraph,
            trajectory, adc, 'timestampSec', 'speed', true);
          this.updateAdcStatusGraph(this.data.realAccelerationGraph,
            trajectory, adc, 'timestampSec', 'acceleration', true);
          this.updateAdcStatusGraph(this.data.realAngleGraph,
            trajectory, adc, 'timestampSec', 'angle', true);
        }

        // trajectory graph update
        this.updateAdcStatusGraph(this.data.trajectoryGraph,
          trajectory, adc, 'positionX', 'positionY');
        this.updateSteerCurve(this.data.trajectoryGraph, adc, vehicleParam);
        this.data.pose.x = adc.positionX;
        this.data.pose.y = adc.positionY;
        this.data.pose.heading = adc.heading;
      }

      if (world.controlData) {
        const control = world.controlData;
        this.setCurrentTargetPoint(this.data.trajectoryGraph, control.currentTargetPoint);
        const timestamp = control.timestampSec;
        this.updateErrorGraph(this.data.stationErrorGraph, timestamp, control.stationError);
        this.updateErrorGraph(this.data.lateralErrorGraph, timestamp, control.lateralError);
        this.updateErrorGraph(this.data.headingErrorGraph, timestamp, control.headingError);
        this.updateTime(timestamp);
      }
    }
}
