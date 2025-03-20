import * as THREE from 'three';
import { toJS } from 'mobx';
import STORE from 'store';

import { DEFAULT_COLOR, ObstacleColorMapping } from 'renderer/obstaclesNew.js';
import {
  drawCircle, drawEllipse, drawSegmentsFromPoints, disposeMesh, drawThickBandFromPoints
} from 'utils/draw';
import Text3D from 'renderer/text3d';
import { roundNumber, findMaxProperty, getCurConfig } from 'utils/misc';

const _ = require('lodash');

const majorThickness = 2;

const EPSILON = 1e-3;

const roadStructurePointColor = {
  default: 0x9d9b9b,
  highProbability: 0xff80ff,
  navigation: 0xff8000,
};

const predictionLowProColor = 0xf41b8b;
const predictionMotionColor = 0xffff00;
let curbColor = 0xff0000;

export default class Prediction {
  constructor() {
    this.predLines = []; // Prediction lines to indicate direction
    this.predCircles = []; // Prediction circles to indicate speed
    this.predGaussian = []; // Prediction ellipse to visualize gaussian
    this.pathintentions = [];
    this.vehicleFlowLines = [];
    this.efficientLaneList = [];
    this.efficientLanePath = [];
    this.textList = [];
    this.textRender = new Text3D();
  }

  disposeMeshes(scene) {
    // Clear out the prediction lines/circles from last frame.
    this.predLines.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.predLines = [];

    this.predCircles.forEach((c) => {
      scene.remove(c);
      disposeMesh(c);
    });
    this.predCircles = [];

    this.predGaussian.forEach((g) => {
      scene.remove(g);
      disposeMesh(g);
    });
    this.predGaussian = [];

    this.pathintentions.forEach((g) => {
      scene.remove(g);
      disposeMesh(g);
    });
    this.pathintentions = [];

    this.vehicleFlowLines.forEach((g) => {
      scene.remove(g);
      disposeMesh(g);
    });
    this.vehicleFlowLines = [];

    this.efficientLaneList.forEach((g) => {
      scene.remove(g);
      disposeMesh(g);
    });
    this.efficientLaneList = [];

    this.efficientLanePath.forEach((g) => {
      scene.remove(g);
      g.geometry.dispose();
      g.material.dispose();
    });
    this.efficientLanePath = [];

    this.textList.forEach((t) => {
      t.children.forEach((c) => c.visible = false);
      scene.remove(t);
    });
    this.textList = [];

    this.textRender.reset();
  }

  update(world, coordinates, scene, camera) {
    this.disposeMeshes(scene);
    this.drawCarOrigin(world, coordinates, scene);

    if (world.efficientLaneChange && world.efficientLaneChange.efficientLaneSequence) {
      this.handleEfficientLane(world.efficientLaneChange.efficientLaneSequence, coordinates, scene, camera);
      if (!STORE.options.showEfficientLane && STORE.options.showEfficientNavi) {
        this.defalutEfficientLane(world.efficientLaneChange.efficientLaneSequence, coordinates, scene, camera);
      }
    }

    if (STORE.options.showRoadNetNnPath && world.egoPathProposalSet && world.egoPathProposalSet.egoPathProposals) {
      this.handleEgoPathProposal(world.egoPathProposalSet.egoPathProposals, coordinates, scene, camera);
    }

    if (world.efficientLaneChange && world.efficientLaneChange.rawCurbTags && STORE.options.showCurbTag) {
      this.handleRawCurbTags(world.efficientLaneChange, coordinates, scene, camera);
    }

    let objects = [];
    const objectFusion = world.objectPredicted && world.objectPredicted.objectFusion;
    if (STORE.options['showPredictionObject'] && Array.isArray(objectFusion) && objectFusion.length > 0) {
      objects = objects.concat(objectFusion);
    }
    if (_.isEmpty(objects)) {
      return;
    }
    // if (_.isEmpty(world.object)) {
    //   return;
    // }
    const enterObstacleId = STORE.meters.enterObstacleId;

    objects.forEach((obj) => {
      if (STORE.options.showRangeView && obj.distance && obj.distance > STORE.meters.autoRange) {
        return;
      }
      let predictionLineColor = ObstacleColorMapping[obj.type] || DEFAULT_COLOR;
      let predictions = obj.prediction;
      this.handlePathintention(obj.pathIntention, coordinates, scene);

      if (obj.vehicleFlowLines && obj.vehicleFlowLines.vehicleFlowLine) {
        this.handleVehicleFlowLines(obj.vehicleFlowLines.vehicleFlowLine, coordinates, scene);
      }
      if (_.isEmpty(predictions)) {
        return;
      }

      if (!STORE.options.showPredictionMajor && !STORE.options.showPredictionMinor) {
        return;
      }

      if (!STORE.options[`showObstacles${_.upperFirst(_.camelCase(obj.type))}`]) {
        return;
      }
      if (enterObstacleId && obj.id !== enterObstacleId) {
        return;
      }

      // Take the prediction line with highest probability as major, others as minor.
      predictions = _.sortBy(predictions, (o) => o.probability);

      // if the biggest prob is 0, then draw all trajectory as major
      if (predictions[predictions.length - 1].probability === 0) {
        // console.log("No prob 0")
        const sameThickness = 2;
        predictions.forEach((prediction) => {
          if (prediction.probability < 0.5) {
            if (!STORE.options.showLowProb) {
              return;
            }
            if (obj.type === 'VEHICLE' && STORE.options.showLowProbColor) {
              predictionLineColor = predictionLowProColor;
            }
          }
          if (prediction.type === 'MOTION') {
            predictionLineColor = predictionMotionColor;
          }
          const traj = prediction.predictedTrajectory;
          const uncertainty = prediction.uncertainty || [];
          if (!traj) {return;}
          const positions = coordinates.applyOffsetToArray(traj);
          const mesh = drawSegmentsFromPoints(
            positions, predictionLineColor, sameThickness, 1,
          );
          this.predLines.push(mesh);
          scene.add(mesh);

          // Draw circles and gaussian
          let sample_draw_points_count = 9;
          for (let j = 0; j < positions.length; j += 1) {
            if (traj[0] && traj[0].mark !== undefined) {
              if (traj[j].mark === true) {
                const circleMesh = this.getPredCircle();
                circleMesh.position.set(positions[j].x, positions[j].y, 0.24);
                circleMesh.material.color.setHex(predictionLineColor);
                scene.add(circleMesh);

                if (STORE.options.showEllipse && uncertainty.length) {
                  const uncer = uncertainty[j];
                  const ellipseMesh = this.getPredEllipse(uncer);
                  ellipseMesh.position.set(positions[j].x, positions[j].y, 0.24);
                  ellipseMesh.material.color.setHex(predictionLineColor);
                  scene.add(ellipseMesh);
                }
              }
            } else {
              if(sample_draw_points_count === 9) {
                sample_draw_points_count = 0;
                const circleMesh = this.getPredCircle();
                circleMesh.position.set(positions[j].x, positions[j].y, 0.24);
                circleMesh.material.color.setHex(predictionLineColor);
                scene.add(circleMesh);
              }
              else{
                sample_draw_points_count += 1;
              }
            }

            this.drawGaussian(
              traj[j].gaussianInfo, predictionLineColor, positions[j], scene,
            );
          }
        });
      }
      else{
        const predictionMajor = predictions[predictions.length - 1];
        const predictionMinor = predictions.slice(0, predictions.length - 1);

        if (STORE.options.showPredictionMajor) {
          const predictedTraj = coordinates.applyOffsetToArray(
            predictionMajor.predictedTrajectory,
          );
          const uncertaintyMajor = predictionMajor.uncertainty || [];
          if (predictionMajor.probability >= 0.5 || STORE.options.showLowProb) {
            if (obj.type === 'VEHICLE' && STORE.options.showLowProbColor && predictionMajor.probability < 0.5) {
              predictionLineColor = predictionLowProColor;
            }
            const mesh = drawSegmentsFromPoints(predictedTraj,
              predictionLineColor, majorThickness, 6);
            this.predLines.push(mesh);
            scene.add(mesh);

            // Draw circles and gaussian
            let sample_draw_points_count = 9;
            for (let j = 0; j < predictedTraj.length; j += 1) {
              if (predictionMajor.predictedTrajectory[0] && predictionMajor.predictedTrajectory[0].mark !== undefined) {
                if (predictionMajor.predictedTrajectory[j].mark === true) {
                  const circleMesh = this.getPredCircle();
                  circleMesh.position.set(predictedTraj[j].x, predictedTraj[j].y, 0.24);
                  circleMesh.material.color.setHex(predictionLineColor);
                  scene.add(circleMesh);
                  if (STORE.options.showEllipse && uncertaintyMajor.length) {
                    const uncerMajor = uncertaintyMajor[j];
                    const ellipseMesh = this.getPredEllipse(uncerMajor);
                    ellipseMesh.position.set(predictedTraj[j].x, predictedTraj[j].y, 0.24);
                    ellipseMesh.material.color.setHex(predictionLineColor);
                    scene.add(ellipseMesh);
                  }
                }
              } else {
                if(sample_draw_points_count === 9) {
                  sample_draw_points_count = 0;
                  const circleMesh = this.getPredCircle();
                  circleMesh.position.set(predictedTraj[j].x, predictedTraj[j].y, 0.24);
                  circleMesh.material.color.setHex(predictionLineColor);
                  scene.add(circleMesh);
                }
                else{
                  sample_draw_points_count += 1;
                }
              }

              this.drawGaussian(
                predictionMajor.predictedTrajectory[j].gaussianInfo,
                predictionLineColor,
                predictedTraj[j],
                scene,
              );
            }
          }
        }

        let minorThickness = 2;
        if (STORE.options.showPredictionMinor) {
          predictionMinor.forEach((prediction) => {
            if (prediction.probability < 0.5) {
              if (!STORE.options.showLowProb) {
                return;
              }
              if (obj.type === 'VEHICLE' && STORE.options.showLowProbColor) {
                predictionLineColor = predictionLowProColor;
              }
            }
            const traj = prediction.predictedTrajectory;
            const uncertainty = prediction.uncertainty || [];
            const positions = coordinates.applyOffsetToArray(traj);
            const mesh = drawSegmentsFromPoints(
              positions, predictionLineColor, minorThickness, 6,
            );
            this.predLines.push(mesh);
            scene.add(mesh);

            let sample_draw_points_count = 9;
            for (let j = 0; j < traj.length; j += 1) {
              if (traj[0] && traj[0].mark !== undefined) {
                if (traj[j].mark === true) {
                  const circleMesh = this.getPredCircle();
                  circleMesh.position.set(positions[j].x, positions[j].y, 0.24);
                  circleMesh.material.color.setHex(predictionLineColor);
                  scene.add(circleMesh);
                  if (STORE.options.showEllipse && uncertainty.length) {
                    const uncer = uncertainty[j];
                    const ellipseMesh = this.getPredEllipse(uncer);
                    ellipseMesh.position.set(positions[j].x, positions[j].y, 0.24);
                    ellipseMesh.material.color.setHex(predictionLineColor);
                    scene.add(ellipseMesh);
                  }
                }
              } else {
                if(sample_draw_points_count === 9) {
                  sample_draw_points_count = 0;
                  const circleMesh = this.getPredCircle();
                  circleMesh.position.set(positions[j].x, positions[j].y, 0.24);
                  circleMesh.material.color.setHex(predictionLineColor);
                  scene.add(circleMesh);
                }
                else{
                  sample_draw_points_count += 1;
                }
              }

              this.drawGaussian(
                traj[j].gaussianInfo, predictionLineColor, positions[j], scene,
              );
            }

            // keep thickness the same trajectories with low probabilities
            if (minorThickness > 0.9) {
              minorThickness -= 0.7;
            }
          });
        }
      }
    });
  }

  handleRawCurbTags(efficientLaneChange, coordinates, scene, camera) {
    const rawCurbTags = efficientLaneChange.rawCurbTags;
    const { selectEfficientLaneSequence, selectEgoPathProposal } = STORE.meters;
    if (selectEfficientLaneSequence && selectEfficientLaneSequence.curbDecisionPair) {
      let curbDecisionPair = selectEfficientLaneSequence?.curbDecisionPair || [];
      if (STORE.options.showRoadNet && selectEgoPathProposal) {
        curbDecisionPair = selectEgoPathProposal?.curbDecisionPair || [];
      }
      rawCurbTags.forEach((tag, index) => {
        if (tag.curbInRoi === false) {
          tag.isIgnore = true;
        } else {
          const curbDec = curbDecisionPair.find(c => c.obsId === tag.curbIdx);
          tag.interactLat = curbDec?.interactLat;
          tag.interactLon = curbDec?.interactLon;
        }
      });
    }
    if (_.isEmpty(rawCurbTags)) {return;}
    rawCurbTags.forEach(item => {
      let text = '';
      if (item.interactLat && findMaxProperty(item.interactLat) === 'ignoreLat') {
        if (item.interactLon) {
          if (item.interactLon.yield > item.interactLon.ignoreLon) {
            text = 'Y';
          }
          if (item.interactLon.ignoreLon > item.interactLon.yield) {
            text = 'G';
          }
        }
      } else {
        if (item.interactLat) {
          if (item.interactLat.bypassRight > item.interactLat.ignoreLat && item.interactLat.bypassRight > item.interactLat.bypassLeft) {
            text = 'R';
          }
          if (item.interactLat.bypassLeft > item.interactLat.ignoreLat && item.interactLat.bypassLeft > item.interactLat.bypassRight) {
            text = 'L';
          }
        }
      }
      if (item.isIgnore) {
        text = 'G';
      }
      if (text && !STORE.options.hideText) {
        const position = coordinates.applyOffset(new THREE.Vector3(item.curbStartX,
          item.curbStartY, 2));
        this.drawTexts(
          text,
          position,
          scene,
          camera,
          0.9,
          0xffff00);
      }

      item.points = [{x: item.curbStartX, y: item.curbStartY}, {x: item.curbEndX, y: item.curbEndY}];
      const positions = coordinates.applyOffsetToArray(item.points);
      const curConfig = getCurConfig();
      if (item.curbStartConfidence !== undefined) {
        if (item.curbStartConfidence === 0 || item.curbEndConfidence === 0) {
          curbColor = 0xff0000;
        }
        if (item.curbStartConfidence === 1 || item.curbEndConfidence === 1) {
          curbColor = 0x0000ff;
        }
        if (item.curbStartConfidence === 2 || item.curbEndConfidence === 2) {
          curbColor = 0xceccf4;
        }
      }
      if (!['roadNavi', 'roadPerception', 'perception', 'pnc', 'pncNn'].includes(curConfig)) {
        curbColor = 0xff0000;
      }
      const mesh = drawSegmentsFromPoints(
        positions, curbColor, 2.5, 3
      );
      this.efficientLaneList.push(mesh);
      scene.add(mesh);
    });
  }

  getInterpolatedPoint(coords, index) {
    const startPointIndex = Math.floor(index * 1.5);
    const endPointIndex = Math.ceil(index * 1.5);

    if (endPointIndex >= coords.length) {
      return coords[coords.length - 1];
    }

    const startPoint = coords[startPointIndex];
    const endPoint = coords[endPointIndex];

    const interpolatedPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    };

    return new THREE.Vector3(interpolatedPoint.x,
      interpolatedPoint.y + 0.5, 3);
  }

  handleEfficientLane(efficientLaneSequence, coordinates, scene, camera) {
    if (_.isEmpty(efficientLaneSequence)) {return;}
    const { selectEfficientLaneSequence, effLaneSinglePath } = STORE.meters;
    const list = efficientLaneSequence;
    let maxIndex = 1;
    if (list.length >= 2) {
      let maxValue = list[1].probability;
      for (let i = 1; i < list.length; i++) {
        if (list[i].probability > maxValue) {
          maxValue = list[i].probability;
          maxIndex = i;
        }
      }
    }
    const startLaneIdsList = [];
    const endLaneIdsList = [];
    list.forEach((item, index) => {
      if (STORE.options.showEfficientLane && !_.isEmpty(item.roadStructurePoint)) {
        let color = roadStructurePointColor.default;
        let roadStructurePointWidth = 0.6;
        if (index === maxIndex) {
          color = roadStructurePointColor.highProbability;
          roadStructurePointWidth = 2.4;
        }
        if (index === 0 && list.length > 1) {
          color = roadStructurePointColor.navigation;
          roadStructurePointWidth = 2.4;
        }
        if (index === 0 && list.length === 1) {
          color = roadStructurePointColor.highProbability;
          roadStructurePointWidth = 2.4;
        }
        const positions = coordinates.applyOffsetToArray(item.roadStructurePoint);
        const efficientLanePath = drawThickBandFromPoints(positions, roadStructurePointWidth, color, 0.3, 4);
        this.efficientLanePath.push(efficientLanePath);
        scene.add(efficientLanePath);
        let endPosition = coordinates.applyOffset(
          new THREE.Vector3(item.roadStructurePoint[Math.floor(item.roadStructurePoint.length - 1)].x,
            item.roadStructurePoint[Math.floor(item.roadStructurePoint.length - 1)].y + 0.5, 3),
        );
        let startPosition = coordinates.applyOffset(
          new THREE.Vector3(item.roadStructurePoint[0].x,
            item.roadStructurePoint[0].y + 0.5, 3),
        );
        let roadStructurePointText = '';
        let alterProbabilities = item.alterProbabilities || [];
        if (STORE.options.showNnPathLow || item.probability > 0.1 || alterProbabilities.some(p => p > 0.1)) {
          roadStructurePointText = `${index}:  ${roundNumber(item.probability, 2)}`;
          let repeatStartNum = 0;
          let repeatEndNum = 0;
          if (item.laneIds && item.laneIds.length > 0) {
            repeatStartNum += startLaneIdsList.filter(id => id === item.laneIds[0]).length || 0;
            repeatEndNum += endLaneIdsList.filter(id => id === item.laneIds[item.laneIds - 1]).length || 0;
            startLaneIdsList.push(item.laneIds[0]);
            endLaneIdsList.push(item.laneIds[item.laneIds - 1]);
          }
          startPosition = coordinates.applyOffset(
            this.getInterpolatedPoint(item.roadStructurePoint, repeatStartNum)
          );
          const endPoints = _.clone(item.roadStructurePoint).reverse();
          endPosition = coordinates.applyOffset(this.getInterpolatedPoint(endPoints, repeatEndNum));
          let text = '';
          if (alterProbabilities && alterProbabilities.length) {
            alterProbabilities = alterProbabilities.map(p => roundNumber(p, 2));
            text = `(${alterProbabilities.join(',')})`;
          } else {
            if (item.cruiseProbability !== undefined && item.exitProbability !== undefined) {
              text = `(${roundNumber(item.cruiseProbability, 2)}, ${roundNumber(item.exitProbability, 2)}, ${roundNumber(item.rawModelProbability, 2)})`;
            }
            if (item.type === 'IN_JUNCTION' || item.type === 'CRUISE') {
              roadStructurePointText = `${index}:  ${roundNumber(item.probability, 2)} (${roundNumber(item.rawModelProbability, 2)})`;
            }
          }
          roadStructurePointText = `${index}:  ${roundNumber(item.probability, 2)} ${text}`;
        }
        roadStructurePointText && this.drawTexts(
          roadStructurePointText,
          endPosition,
          scene,
          camera,
          0.8,
          0xffff00);
        roadStructurePointText && this.drawTexts(
          roadStructurePointText,
          startPosition,
          scene,
          camera,
          0.8,
          0xffff00);
      }

      if (!_.isEmpty(item.egoPathPoint)) {
        if (effLaneSinglePath && STORE.options.showEfficientLaneMonitor) {
          return;
        }
        if (item.probability > 0.1 && !STORE.options.showNnPath && !item.selected) {
          return;
        }
        if (item.probability <= 0.1 && !STORE.options.showNnPathLow && !item.selected) {
          return;
        }
        const positions = coordinates.applyOffsetToArray(item.egoPathPoint);
        const mesh = drawSegmentsFromPoints(
          positions, 0xbf0000, 8, 6, true, false, 0.1
        );
        this.efficientLaneList.push(mesh);
        scene.add(mesh);

        this.drawEgoPathText(item, coordinates, scene, camera, index);
      }
    });
    if (effLaneSinglePath && STORE.options.showEfficientLaneMonitor) {
      const egoPathPoint = selectEfficientLaneSequence?.egoPathPoint || [];
      const positions = coordinates.applyOffsetToArray(toJS(egoPathPoint));
      const mesh = drawSegmentsFromPoints(
        positions, 0xbf0000, 8, 6, true, false, 0.1
      );
      this.efficientLaneList.push(mesh);
      scene.add(mesh);

      this.drawEgoPathText(selectEfficientLaneSequence, coordinates, scene, camera, '');
    }
  }

  drawEgoPathText(obj, coordinates, scene, camera, initText = '') {
    const initPosition = coordinates.applyOffset(
      new THREE.Vector3(obj.egoPathPoint[Math.floor(obj.egoPathPoint.length - 1)].x,
        obj.egoPathPoint[Math.floor(obj.egoPathPoint.length - 1)].y + 0.5, 3),
    );
    let text = `${initText}`;
    if (STORE.options.showGlobalAction && obj.globalAction) {
      obj.globalAction.forEach((g, i) => {
        const words = g.split('_');
        if (!text) {
          text += words.map(word => word.charAt(0)).join('');
        } else {
          text += `-${words.map(word => word.charAt(0)).join('')}`;
        }
      });
    }
    this.addTextMesh(text, camera, 0xffff00, {x: initPosition.x, y: initPosition.y, z: initPosition.z}, 1.1, scene);
  }


  defalutEfficientLane(efficientLaneSequence, coordinates, scene, camera) {
    if (_.isEmpty(efficientLaneSequence)) {return;}
    const list = efficientLaneSequence;
    let maxIndex = 1;
    if (list.length >= 2) {
      let maxValue = list[1].probability;
      for (let i = 1; i < list.length; i++) {
        if (list[i].probability > maxValue) {
          maxValue = list[i].probability;
          maxIndex = i;
        }
      }
    }
    list.forEach((item, index) => {
      if (!_.isEmpty(item.roadStructurePoint)) {
        let color = roadStructurePointColor.default;
        let roadStructurePointWidth = 0.6;
        if (index === maxIndex) {
          color = roadStructurePointColor.highProbability;
          roadStructurePointWidth = 2.4;
        }
        if (index === 0 && list.length > 1) {
          color = roadStructurePointColor.navigation;
          roadStructurePointWidth = 2.4;
        }
        if (index === 0 && list.length === 1) {
          color = roadStructurePointColor.highProbability;
          roadStructurePointWidth = 2.4;
        }

        if (color === roadStructurePointColor.highProbability) {
          const positions = coordinates.applyOffsetToArray(item.roadStructurePoint);
          const efficientLanePath = drawThickBandFromPoints(positions, roadStructurePointWidth, color, 0.3, 4);
          this.efficientLanePath.push(efficientLanePath);
          scene.add(efficientLanePath);
          const endPosition = coordinates.applyOffset(
            new THREE.Vector3(item.roadStructurePoint[Math.floor(item.roadStructurePoint.length - 1)].x,
              item.roadStructurePoint[Math.floor(item.roadStructurePoint.length - 1)].y + 0.5, 3),
          );
          const startPosition = coordinates.applyOffset(
            new THREE.Vector3(item.roadStructurePoint[0].x,
              item.roadStructurePoint[0].y + 0.5, 3),
          );

          const roadStructurePointText = `${index}:  ${roundNumber(item.probability, 2)}`;
          roadStructurePointText && this.drawTexts(
            roadStructurePointText,
            endPosition,
            scene,
            camera,
            0.8,
            0xffff00);
          roadStructurePointText && this.drawTexts(
            roadStructurePointText,
            startPosition,
            scene,
            camera,
            0.8,
            0xffff00);
        }
      }
    });
  }

  handleEgoPathProposal(egoPathProposals, coordinates, scene, camera) {
    if (_.isEmpty(egoPathProposals)) {return;}
    egoPathProposals.forEach((item, index) => {
      if (STORE.meters.nnPathSwitch[index] === false) {
        return;
      }
      if (!_.isEmpty(item.path)) {
        const positions = coordinates.applyOffsetToArray(item.path);
        const mesh = drawSegmentsFromPoints(
          positions, 0xbf0000, 6, 6, true, false, 0.1
        );
        this.efficientLaneList.push(mesh);
        scene.add(mesh);

        const initPosition = coordinates.applyOffset(
          new THREE.Vector3(item.path[Math.floor(item.path.length - 1)].x,
            item.path[Math.floor(item.path.length - 1)].y + 0.5, 3),
        );
        if (item.globalAction) {
          let text = '';
          item.globalAction.forEach((g, i) => {
            const words = g.split('_');
            if (i === item.globalAction.length - 1) {
              text += words.map(word => word.charAt(0)).join('');
            } else {
              text += `-${words.map(word => word.charAt(0)).join('')}`;
            }
          });
          if (item.score) {
            text = `${text}: ${roundNumber(item.score, 2)}`;
          }
          this.drawTexts(
            text,
            initPosition,
            scene,
            camera,
            0.9,
            0xffff00);
        }
      }

      if (!_.isEmpty(item.referenceLine)) {
        const positions = coordinates.applyOffsetToArray(item.referenceLine);
        const mesh = drawSegmentsFromPoints(positions,
          0x90aef4, 2, 8);
        this.predLines.push(mesh);
        scene.add(mesh);
      }
    });
  }

  drawTexts(content, position, scene, camera, size = 1.4, color = 0xFFEA00) {
    if (camera !== undefined) {
      const text = this.textRender.drawText(content, scene, camera, color, size);
      if (text) {
        text.position.set(position.x, position.y, position.z);
        text.scale.set(size, size, 0);
        text.children.forEach((child) => {
          child.material.color.setHex(color);
        });
        this.textList.push(text);
        scene.add(text);
      }
    }
  }

  addTextMesh(text, camera, color, position, size, scene, offsetBase = 2) {
    const textMesh = new THREE.Object3D();
    const { charMesh, charWidth }  = this.textRender.drawChar3D(text, color, size);
    textMesh.position.set(position.x, position.y, position.z);
    textMesh.add(charMesh);
    textMesh.children.forEach((child) => {
      child.position.setX(child.position.x - charWidth / offsetBase);
    });
    if (camera !== undefined && camera.quaternion !== undefined) {
      textMesh.quaternion.copy(camera.quaternion);
    }
    scene.add(textMesh);
    this.textList.push(textMesh);
  }

  handlePathintention(pathIntention, coordinates, scene) {
    if (!STORE.options.showPredictionPath) {
      return;
    }
    if (_.isEmpty(pathIntention)) {return;}
    pathIntention.forEach(item => {
      if (_.isEmpty(item.pathPoint)) {
        return;
      }

      const positions = coordinates.applyOffsetToArray(item.pathPoint);
      const mesh = drawSegmentsFromPoints(
        positions, 0x808080, 2, 6,
      );
      this.pathintentions.push(mesh);
      scene.add(mesh);
    });
  }

  handleVehicleFlowLines(vehicleFlowLines, coordinates, scene) {
    if (!STORE.options.showVehicleFlowLines) {
      return;
    }
    if (_.isEmpty(vehicleFlowLines)) {return;}
    vehicleFlowLines.forEach(item => {
      if (_.isEmpty(item.flowPoint)) {
        return;
      }

      const positions = coordinates.applyOffsetToArray(item.flowPoint);
      const mesh = drawSegmentsFromPoints(
        positions, 0xFF0000, 2, 6,
      );
      this.vehicleFlowLines.push(mesh);
      scene.add(mesh);
    });
  }

  getPredCircle() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: false,
      opacity: 0.5,
    });
    const circleMesh = drawCircle(0.2, material);
    this.predCircles.push(circleMesh);
    return circleMesh;
  }

  getPredEllipse(uncer) {
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 1, // 设置线宽
    });

    const curve = new THREE.EllipseCurve(
      0, 0,    // centerX, centerY
      uncer.sSigma, uncer.lSigma,    // xRadius, yRadius
      0, Math.PI * 2,  // startAngle, endAngle
      false,
      uncer.theta
    );

    const points = curve.getPoints(50);
    const list = [];
    points.forEach(item => {
      list.push(item.x);
      list.push(item.y);
    });
    const vertices = new Float32Array(list);
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    const ellipseMesh = new THREE.Line(geometry, material);
    this.predCircles.push(ellipseMesh);
    return ellipseMesh;
  }

  drawGaussian(gaussian, color, position, scene) {
    if (!STORE.options.showGaussianInfo) {
      return;
    }

    if (gaussian && gaussian.ellipseA > EPSILON && gaussian.ellipseB > EPSILON) {
      const material = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.35,
      });
      const ellipseMesh = drawEllipse(
        gaussian.ellipseA, gaussian.ellipseB, material,
      );

      ellipseMesh.position.set(position.x, position.y, 0.25);
      ellipseMesh.rotation.set(0, 0, gaussian.thetaA);
      this.predGaussian.push(ellipseMesh);
      scene.add(ellipseMesh);
    }
  }

  drawCarOrigin(world, coordinates, scene) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: false,
      opacity: 0.5,
    });
    const position = coordinates.applyOffset(new THREE.Vector3(world.autoDrivingCar.positionX,
      world.autoDrivingCar.positionY, 2));
    const circleMesh = drawCircle(0.1, material);
    circleMesh.position.set(position.x, position.y, 2);
    this.predCircles.push(circleMesh);
    scene.add(circleMesh);
  }
}