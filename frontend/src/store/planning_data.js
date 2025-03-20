import { action, observable } from 'mobx';
import { LinearInterpolant } from 'three';
import { parseChartDataFromProtoBuf } from 'utils/chart';
import SETTING from 'store/config/PlanningGraph.yml';
import STORE from 'store';

const MAX_SCENARIO_LENGTH = 5;

const PATH_DISPLAY_NAME = SETTING.nameMapper;

const speedLimitType = {
  INIT: 1,
  DRIVER: 2,
  KAPPA: 3,
  STOPLINE: 4,
  CROSSWALK: 5,
  NUDGE: 6,
  APPROACH_NAVI_END: 7,
  DKAPPA: 8,
  NARROW_ROAD: 9,
  UTURN: 10,
  UTURN_DKAPPA: 11,
  BEHAVIOR_MAP: 12,
};
const bonusSpeedLimitType = {
  EX_CROSSING:1,
  EX_VRU:2,
  EX_BLIND_SPOT:3,
  EX_OTHERS:4,
};

export default class PlanningData {
    @observable planningTimeSec = null;

    @observable planningObstacleId = null;

    data = this.initData();

    chartData = [];

    scenarioHistory = [];

    @action updatePlanningTime(newTimeInSec) {
      this.planningTimeSec = newTimeInSec;
    }

    @action updatePlanningObstacleId(obstacleId) {
      this.planningObstacleId = obstacleId + '';
    }

    initData() {
      return {
        slGraph: {},
        stGraph: {},
        stSpeedGraph: {},
        speedGraph: {},
        accelerationGraph: {},
        thetaGraph: {},
        kappaGraph: {},
        dkappaGraph: {},
        debugStGraph: {},
        speedLimitRef: {},
      };
    }

    generateDataPoints(X, Y, transform) {
      if (!X || !Y || X.length !== Y.length) {
        return [];
      }

      const bound = [];
      for (let idx = 0; idx < Y.length; idx++) {
        const x = Number(X[idx]);
        let y = Number(Y[idx]);
        if (transform !== undefined) {
          y = transform(y);
        }
        bound.push({ x, y });
      }
      return bound;
    }

    transformMapBound(l) {
      return (l > 10 || l < -10) ? (100 * l / Math.abs(l)) : l;
    }

    extractDataPoints(data, xField, yField, loopBack = false, xOffset = 0) {
      if (!data) {
        return [];
      }

      const points = data.map((point) => ({ x: point[xField] + xOffset, y: point[yField] }));

      if (loopBack && data.length) {
        points.push({ x: data[0][xField], y: data[0][yField] });
      }

      return points;
    }

    extractSpeedLimit(data, xField, yField) {
      if (!data) {
        return [];
      }
      const points = data.map((point) => {
        const x = point[xField];
        let y = point[yField];
        if (yField === 'basicTag') {
          y = speedLimitType[point[yField]];
        }
        if (yField === 'bonusTag') {
          y = bonusSpeedLimitType[point[yField]];
        }
        return { x, y  };
      });
      return points;
    }

    updateSLFrame(slFrame) {
      const graph = this.data.slGraph;

      const sampledS = slFrame[0].sampledS;
      graph.mapLowerBound = this.generateDataPoints(
        sampledS, slFrame[0].mapLowerBound, this.transformMapBound,
      );
      graph.mapUpperBound = this.generateDataPoints(
        sampledS, slFrame[0].mapUpperBound, this.transformMapBound,
      );
      graph.staticObstacleLowerBound =
            this.generateDataPoints(sampledS, slFrame[0].staticObstacleLowerBound);
      graph.staticObstacleUpperBound =
            this.generateDataPoints(sampledS, slFrame[0].staticObstacleUpperBound);
      graph.dynamicObstacleLowerBound =
            this.generateDataPoints(sampledS, slFrame[0].dynamicObstacleLowerBound);
      graph.dynamicObstacleUpperBound =
            this.generateDataPoints(sampledS, slFrame[0].dynamicObstacleUpperBound);
      graph.pathLine = this.extractDataPoints(slFrame[0].slPath, 's', 'l');

      const aggregatedBoundaryS = slFrame[1].aggregatedBoundaryS;
      graph.aggregatedBoundaryLow = this.generateDataPoints(
        aggregatedBoundaryS, slFrame[1].aggregatedBoundaryLow,
      );
      graph.aggregatedBoundaryHigh = this.generateDataPoints(
        aggregatedBoundaryS, slFrame[1].aggregatedBoundaryHigh,
      );
    }

    updateVtProfilePoint(vtProfilePoint) {
      if (!_.isEmpty(vtProfilePoint)) {
        const graph = this.data.stGraph['ILQR_SPEED_OPTIMIZER'];
        graph.vtProfilePoint = this.extractDataPoints(vtProfilePoint, 't', 's');
      }
    }

    updateSTGraph(stGraphs) {
      if (stGraphs.length > 1 && stGraphs[0]['name'] === 'SPEED_HEURISTIC_OPTIMIZER' && stGraphs[1]['name'] === 'ILQR_SPEED_OPTIMIZER') {
        // console.log('stGraphs = ', stGraphs);
        stGraphs[1]['newSpeedProfile'] = stGraphs[0]['speedProfile'];
      }
      for (const stGraph of stGraphs) {
        this.data.stGraph[stGraph.name] = { obstaclesBoundary: {} };
        const graph = this.data.stGraph[stGraph.name];

        // obstacle boundary lines
        if (stGraph.boundary) {
          for (const boundary of stGraph.boundary) {
            if (this.planningObstacleId && !boundary.name.includes(this.planningObstacleId)) {continue;}
            if (STORE.options.showPNCPlanningCore && boundary.corePoint) {
              const coreLabel = `${boundary.name}_core`;
              graph.obstaclesBoundary[coreLabel] = this.extractDataPoints(boundary.corePoint, 't', 's', true);
            }
            if (STORE.options.showPNCPlanningBoundary) {
              const type = boundary.type.substring('ST_BOUNDARY_TYPE_'.length);
              const label = `${boundary.name}_${type}`;
              graph.obstaclesBoundary[label] = this.extractDataPoints(boundary.point, 't', 's', true);
            }
            if (STORE.options.showPNCPlanningBuffer && boundary.bufferPoint) {
              const bufferLabel = `${boundary.name}_buffer`;
              graph.obstaclesBoundary[bufferLabel] = this.extractDataPoints(boundary.bufferPoint, 't', 's', true);
            }
          }
        }

        // curve line
        graph.curveLine = this.extractDataPoints(stGraph.speedProfile, 't', 's');

        // speedProfile line
        if (stGraph.newSpeedProfile) {
          graph.speedProfileLine = this.extractDataPoints(stGraph.newSpeedProfile, 't', 's');
        }

        // kernel cruise line
        if (stGraph.kernelCruiseRef) {
          graph.kernelCruise = this.generateDataPoints(
            stGraph.kernelCruiseRef.t, stGraph.kernelCruiseRef.cruiseLineS,
          );
        }

        // kernel follow line
        if (stGraph.kernelFollowRef) {
          graph.kernelFollow = this.generateDataPoints(
            stGraph.kernelFollowRef.t, stGraph.kernelFollowRef.followLineS,
          );
        }
      }
    }

    updateSTSpeedGraph(stGraphs) {
      for (const stGraph of stGraphs) {
        this.data.stSpeedGraph[stGraph.name] = {};
        const graph = this.data.stSpeedGraph[stGraph.name];

        this.data.speedLimitRef[stGraph.name] = {};
        const speedLimitGraph = this.data.speedLimitRef[stGraph.name];

        // speed: limit
        graph.limit = this.extractDataPoints(stGraph.speedLimit, 's', 'v');

        // speed: planned
        graph.planned = this.extractDataPoints(stGraph.speedProfile, 's', 'v');

        speedLimitGraph.basicTag = this.extractSpeedLimit(stGraph.speedLimitReference, 's', 'basicTag');
        speedLimitGraph.bonusTag = this.extractSpeedLimit(stGraph.speedLimitReference, 's', 'bonusTag');

        // speed: constraint
        if (stGraph.speedConstraint) {
          const curveT = stGraph.speedProfile.map((point) => point.t);
          const curveS = stGraph.speedProfile.map((point) => point.s);
          const interpolant = new LinearInterpolant(curveT, curveS, 1, []);
          const speedConstraintS =
                    stGraph.speedConstraint.t.map((point) => interpolant.evaluate(point)[0]);

          graph.lowerConstraint = this.generateDataPoints(
            speedConstraintS, stGraph.speedConstraint.lowerBound,
          );
          graph.upperConstraint = this.generateDataPoints(
            speedConstraintS, stGraph.speedConstraint.upperBound,
          );
        }
      }
    }

    updateDebugStGraph(stGraphs) {
      for (const stGraph of stGraphs) {
        if (stGraph.name === 'ILQR_SPEED_OPTIMIZER') {}
        this.data.debugStGraph[stGraph.name] = {};
        const graph = this.data.debugStGraph[stGraph.name];

        if (stGraph.vtSpeedProfile) {
          graph.vtSpeedProfile = this.extractDataPoints(stGraph.vtSpeedProfile, 't', 'v');
        }
        if (stGraph.speedProfile) {
          graph.speedProfile = this.extractDataPoints(stGraph.speedProfile, 't', 'v');
        }
        if (stGraph.speedReference) {
          graph.speedReference = this.extractDataPoints(stGraph.speedReference, 't', 'v');
        }
      }
    }

    updateSpeed(speedPlans, trajectory) {
      const graph = this.data.speedGraph;
      if (speedPlans) {
        for (const plan of speedPlans) {
          const name = PATH_DISPLAY_NAME[plan.name] || plan.name;
          graph[name] = this.extractDataPoints(plan.speedPoint, 't', 'v');
        }
      }

      if (trajectory) {
        graph.VehicleSpeed = this.extractDataPoints(
          trajectory, 'timestampSec', 'speed', false /* loop back */, -this.planningTimeSec,
        );
      }
    }

    updateAccelerationGraph(trajectory) {
      const graph = this.data.accelerationGraph;
      if (trajectory) {
        graph.acceleration = this.extractDataPoints(
          trajectory, 'timestampSec', 'speedAcceleration', false /* loop back */, -this.planningTimeSec,
        );
      }
    }

    updatePathThetaGraph(paths) {
      for (const path of paths) {
        const name = PATH_DISPLAY_NAME[path.name] || path.name;
        this.data.thetaGraph[name] = this.extractDataPoints(path.pathPoint, 's', 'theta');
      }
    }

    updateTrajectoryThetaGraph(trajectory) {
      if (trajectory) {
        this.data.thetaGraph.Trajectory = this.extractDataPoints(trajectory, 'timestampSec', 'heading');
      }
    }

    updatePathKappaGraph(paths) {
      for (const path of paths) {
        const name = PATH_DISPLAY_NAME[path.name] || path.name;
        this.data.kappaGraph[name] = this.extractDataPoints(path.pathPoint, 's', 'kappa');
      }
    }

    updateTrajectoryKappaGraph(trajectory) {
      if (trajectory) {
        this.data.kappaGraph.Trajectory = this.extractDataPoints(trajectory, 'timestampSec', 'kappa');
      }
    }

    updatePathDkappaGraph(paths) {
      for (const path of paths) {
        const name = PATH_DISPLAY_NAME[path.name] || path.name;
        this.data.dkappaGraph[name] = this.extractDataPoints(path.pathPoint, 's', 'dkappa');
      }
    }

    updateTrajectoryDkappaGraph(trajectory) {
      if (trajectory) {
        this.data.dkappaGraph.Trajectory = this.extractDataPoints(trajectory, 'timestampSec', 'dkappa');
      }
    }

    updateScenario(newScenario, newTimeInSec) {
      if (!newScenario) {
        return;
      }

      const currScenario = this.scenarioHistory.length > 0
        ? this.scenarioHistory[this.scenarioHistory.length - 1] : {};

      if (currScenario.timeSec && newTimeInSec < currScenario.timeSec) {
        // new data set, clean up existing one
        this.scenarioHistory = [];
      }

      if (currScenario.scenarioType !== newScenario.scenarioType
            || currScenario.stageType !== newScenario.stageType) {
        this.scenarioHistory.push({
          timeSec: newTimeInSec,
          scenarioType: newScenario.scenarioType,
          stageType: newScenario.stageType,
        });
        if (this.scenarioHistory.length > MAX_SCENARIO_LENGTH) {
          this.scenarioHistory.shift();
        }
      }
    }

    update(world) {
      const planningData = world.planningData;
      const debugPlanningData = world?.debug?.planningData;
      let vtProfilePoint = world?.debug?.ilqrDebug?.efficientLaneSeq?.vtProfilePoint || [];
      if (planningData) {
        const newPlanningTime = world?.latency?.planning?.timestampSec;
        if (this.planningTimeSec === newPlanningTime) {
          return;
        }

        if (planningData.scenario) {
          this.updateScenario(planningData.scenario, newPlanningTime);
        }

        this.chartData = [];
        this.data = this.initData();

        if (planningData.chart) {
          for (const chart of planningData.chart) {
            this.chartData.push(parseChartDataFromProtoBuf(chart));
          }
        }

        if (planningData.slFrame && planningData.slFrame.length >= 2) {
          this.updateSLFrame(planningData.slFrame);
        }

        if (planningData.stGraph) {
          if (debugPlanningData) {
            const speedOptimizerDebug = debugPlanningData.stGraph.find(st => st.name === 'ILQR_SPEED_OPTIMIZER');
            vtProfilePoint = speedOptimizerDebug?.vtSpeedProfile || [];
          }
          const planningDataOptimizer = planningData.stGraph.find(st => st.name === 'ILQR_SPEED_OPTIMIZER') || {};
          if (planningDataOptimizer.stIlqrReference) {
            vtProfilePoint = planningDataOptimizer?.stIlqrReference || [];
          }
          this.updateSTGraph(planningData.stGraph);
          this.updateSTSpeedGraph(planningData.stGraph);
          this.updateVtProfilePoint(vtProfilePoint);
        }
        if (planningData && planningData.stGraph) {
          this.updateDebugStGraph(planningData.stGraph);
        }
        if (debugPlanningData && debugPlanningData.stGraph) {
          this.updateDebugStGraph(debugPlanningData.stGraph);
        }

        if (planningData.speedPlan && world.planningTrajectory) {
          this.updateSpeed(planningData.speedPlan, world.planningTrajectory);
        }

        if (world.planningTrajectory) {
          this.updateAccelerationGraph(world.planningTrajectory);
          this.updateTrajectoryThetaGraph(world.planningTrajectory);
          this.updateTrajectoryKappaGraph(world.planningTrajectory);
          this.updateTrajectoryDkappaGraph(world.planningTrajectory);
        }

        if (planningData.path) {
          this.updatePathKappaGraph(planningData.path);
          this.updatePathDkappaGraph(planningData.path);
          this.updatePathThetaGraph(planningData.path);
        }

        this.updatePlanningTime(newPlanningTime);
      }
    }
}
