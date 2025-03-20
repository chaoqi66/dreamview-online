import * as THREE from 'three';
import _ from 'lodash';

import STORE from 'store';
import Text3D from 'renderer/text3d';
import { copyProperty, hideArrayObjects, convertToUpperCaseWithUnderscore, roundNumber } from 'utils/misc';
import { drawSegmentsFromPoints, drawArrow } from 'utils/draw';

const DEFAULT_HEIGHT = 1.5;
export const DEFAULT_COLOR = 0xFFFFFF;
export const ObstacleTopicColorMapping = {
  // 激光神经网络结果
  '/bev_object': 0xCAFF70,

  // 视觉神经网络结果
  '/pv_fm_narrow_object': 0x68838B,
  '/pv_fm_wide_object': 0x8B008B,
  '/pv_lb_pinhole_object': 0x104E8B,
  '/pv_rb_pinhole_object': 0x104E8B,
  '/pv_fm_fisheye_object': 0xA52A2A,
  '/pv_lm_fisheye_object': 0xFFA07A,
  '/pv_rm_fisheye_object': 0xFFA07A,
  '/pv_bm_fisheye_object': 0xFF4500,

  // 激光后处理
  '/bev_post_object': 0x008B00,

  // 视觉后处理
  '/pv_post_fm_narrow_object': 0xBFEFFF,
  '/pv_post_fm_wide_object': 0xFF00FF,
  '/pv_post_lb_pinhole_object': 0x1E90FF,
  '/pv_post_rb_pinhole_object': 0x1E90FF,

  // 通用障碍物
  '/occupancy_object': 0xFFDEAD
};
export const ObstacleColorMapping = {
  PEDESTRIAN: 0xFFEA00,
  BICYCLE: 0x00DCEB,
  VEHICLE: 0x00FF3C,
  VIRTUAL: 0x800000,
  CIPV: 0xFF9966,
};
let InteractLatColorMapping = {
  IGNORE_LAT: 0xDCDCDC,
  BYPASS_LEFT: 0x3636a9,
  BYPASS_RIGHT: 0x1E90FF,
};
let InteractLonColorMapping = {
  IGNORE_LON: 0xD3D3D3,
  FOLLOW: 0x058905,
  OVERTAKE: 0xe5e550,
  YIELD: 0xbd4d4d
};
const LINE_THICKNESS = 1.5;
// exist_confidence 0高，1中，2低
const EXIST_CCONFIDENCE_COLOR = {
  0: 0xffffff,
  1: 0xffff00,
  2: 0x00ff00,
};

const notUniversalObstacles = ['TYPE_CAR', 'TYPE_BUS', 'TYPE_CONSTRN_VEH', 'TYPE_TRICYCLE', 'TYPE_ARTICULATED_HEAD', 'TYPE_ARTICULATED_BODY', 'TYPE_CYC', 'TYPE_PED', 'TYPE_TRUCK'];

export default class PerceptionObstaclesNew {
  constructor() {
    this.textRender = new Text3D();
    this.arrows = []; // for indication of direction of moving obstacles
    this.ids = []; // for obstacle id labels
    this.solidCubes = []; // for obstacles with only length/width/height
    this.dashedCubes = []; // for obstacles with only length/width/height
    this.extrusionSolidFaces = []; // for obstacles with polygon points
    this.extrusionSolidFacesPnc = [];
    this.extrusionDashedFaces = []; // for obstacles with polygon points
    this.laneMarkers = []; // for lane markers
    this.icons = [];
    this.trafficCones = []; // for traffic cone meshes
    this.v2xCubes = [];
    this.v2xSolidFaces = [];

    this.arrowIdx = 0;
    this.cubeIdx = 0;
    this.extrusionFaceIdx = 0;
    this.extrusionPncFaceIdx = 0;
    this.iconIdx = 0;
    this.trafficConeIdx = 0;
    this.v2xCubeIdx = 0;
    this.v2xSolidFaceIdx = 0;

    this.interactLonBottomList = [];
    this.bboxList = [];
    this.textList = [];
  }

  update(world, coordinates, scene, camera, size, isBirdView) {
    if (STORE.options.showInteractColor) {
      InteractLatColorMapping = {
        IGNORE_LAT: 0xDCDCDC,
        BYPASS_LEFT: 0x0000FF,
        BYPASS_RIGHT: 0x1E90FF,
      };
      InteractLonColorMapping = {
        IGNORE_LON: 0xD3D3D3,
        FOLLOW: 0x00FF7F,
        OVERTAKE: 0xFFFF00,
        YIELD: 0xFF0000,
      };
    }
    if (camera !== undefined) {
      this.resetObjects(scene, _.isEmpty(world.objectPredicted));
      this.updateObjects(world, coordinates, scene, camera, size, isBirdView);
      if (world.efficientLaneChange && world.efficientLaneChange.rawCurbTags) {
        this.handleRawCurbTags(world.efficientLaneChange, coordinates, scene);
      }
      let pncPreList = [];
      const scenes = world?.planningData?.multiPolicyDebug?.scenes || [];
      if (world.laneChangeFsmStatus === 'IN_LANE_CHANGE') {
        const sc = scenes.find(item => item.egoForwardPath.name === 'lc scene');
        pncPreList = sc?.egoForwardPath?.pathPoint || [];
      } else {
        const sc = scenes.find(item => item.egoForwardPath.name === 'lk scene');
        pncPreList = sc?.egoForwardPath?.pathPoint || [];
      }
      if (pncPreList && pncPreList.length) {
        this.drawPlanningTrajectory(pncPreList, coordinates, scene);
      }
      this.hideUnusedObjects();
    }
  }

  updateObjects(world, coordinates, scene, camera, size, isBirdView) {
    let objects = [];
    const objectFusionPredicted = world.objectPredicted && world.objectPredicted.objectFusion;
    if (STORE.options['showPredictionObject'] && Array.isArray(objectFusionPredicted) && objectFusionPredicted.length > 0) {
      objectFusionPredicted.forEach(item => {
        item.isPrediction = true;
      });
      objects = objects.concat(objectFusionPredicted);
    }

    if (_.isEmpty(objects)) {
      return;
    }
    // console.log('obstaclesNew objects = ', objects);

    const adc = coordinates.applyOffset({
      x: world.autoDrivingCar.positionX,
      y: world.autoDrivingCar.positionY,
    });
    adc.heading = world.autoDrivingCar.heading;

    for (let i = 0; i < objects.length; i++) {
      const obstacle = objects[i];
      if (!STORE.options[`showObstacles${_.upperFirst(_.camelCase(obstacle.type))}`]
          || !_.isNumber(obstacle.positionX) || !_.isNumber(obstacle.positionY)) {
        continue;
      }

      if (!STORE.options.showObstaclesV2xInfo && obstacle.source === 'V2X') {
        continue;
      }

      if (!STORE.options[`showObstacles${_.upperFirst(_.camelCase(obstacle.topic))}`]) {
        continue;
      }

      if (!STORE.options.showUniversalObstacles && !notUniversalObstacles.includes(obstacle.objectType)) {
        continue;
      }

      let pncPreLine = obstacle.planningPathPoint;
      let bboxColor = 0xffffff;
      const predictionTrajectoryIndex = obstacle.predictionTrajectoryIndex || 0;
      if (!pncPreLine && obstacle.prediction) {
        pncPreLine = obstacle.prediction[predictionTrajectoryIndex]?.predictedTrajectory || [];
      }
      if (pncPreLine && pncPreLine.length) {
        this.drawPredictionLine(pncPreLine, coordinates, scene);
      }
      if (obstacle.predictionTrajectoryIndex === undefined && !obstacle.predictionTrajectoryIndex) {
        bboxColor = 0xff0000;
      }
      let position = null;
      const pncPreWorldIndex = world.pncPreWorldIndex;
      if (pncPreWorldIndex !== undefined && pncPreLine) {
        const pncPreIndex = pncPreWorldIndex >= pncPreLine.length ? pncPreLine.length - 1 : pncPreWorldIndex;
        const nextPositionX = pncPreLine[pncPreIndex]?.x;
        const nextPositionY = pncPreLine[pncPreIndex]?.y;
        const nextPositionHead = pncPreLine[pncPreIndex]?.theta;
        nextPositionX && (obstacle.positionX = nextPositionX);
        nextPositionY && (obstacle.positionY = nextPositionY);
        if (nextPositionHead) {
          obstacle.heading = nextPositionHead;
          obstacle.speedHeading = nextPositionHead;
        }
        position = coordinates.applyOffset(
          new THREE.Vector3(obstacle.positionX,
            obstacle.positionY,
            (obstacle.height || DEFAULT_HEIGHT) / 2),
        );
      } else {
        position = coordinates.applyOffset(
          new THREE.Vector3(obstacle.positionX,
            obstacle.positionY,
            (obstacle.height || DEFAULT_HEIGHT) / 2),
        );
      }
      let color = ObstacleColorMapping[obstacle.type] || DEFAULT_COLOR;
      if (obstacle.isObjectInner) {
        color = ObstacleTopicColorMapping[obstacle.topic] || DEFAULT_COLOR;
      }
      // const color = ObstacleTopicColorMapping[obstacle.topic] || DEFAULT_COLOR;
      const isV2X = (obstacle.source === 'V2X');

      // console.log('obstacle.predictionDecision = ', obstacle.predictionDecision);
      if (obstacle.isPrediction && obstacle.predictionDecision && obstacle.predictionDecision.length > 0) {
        let predictionDecision = obstacle.predictionDecision[0];
        const decisionRetPair = STORE.meters.selectEfficientLaneSequence?.decisionRetPair;
        if (decisionRetPair) {
          const decision = decisionRetPair.find(dec => String(dec.obsId) === String(obstacle.id));
          if (decision) {
            predictionDecision = decision;
          }
        }
        const interactLon = predictionDecision.interactLon;
        const interactLat = predictionDecision.interactLat;
        if (STORE.options.showPredictionDecision && interactLat instanceof Object) {
          const maxKey = this.findBypassKey(interactLat);
          if (maxKey) {
            color = InteractLatColorMapping[convertToUpperCaseWithUnderscore(maxKey)] || DEFAULT_COLOR;
            obstacle.isPredictionDecision = true;
          }
        }
      }

      if (STORE.options.showObstaclesVelocity && obstacle.type
        && obstacle.type !== 'UNKNOWN_UNMOVABLE' && obstacle.speed > 0.5) {
        const arrowMesh = this.updateArrow(position,
          obstacle.speedHeading, color, scene);
        this.arrowIdx++;
        let scale = 1 + Math.log2(obstacle.speed);
        if (STORE.options.showPerceptionObject) {
          scale = obstacle.speed;
        }
        arrowMesh.scale.set(scale, scale, scale);
        arrowMesh.visible = true;
      }

      if (STORE.options.showObstaclesHeading) {
        if (obstacle.objectType !== 'TYPE_STATIC_UNKNOWN' || (obstacle.objectType === 'TYPE_STATIC_UNKNOWN' && STORE.options.showPerceptionTypeStaticUnkonwn)) {
          this.drawObstacleHeading(position, obstacle.heading, scene);
          this.arrowIdx++;
        }
      }

      if (!STORE.options.hideText) {
        this.updateTexts(adc, obstacle, position, scene, camera, size, isBirdView, isV2X);
      }

      // get the confidence and validate its range
      let confidence = obstacle.confidence;
      confidence = Math.max(0.0, confidence);
      confidence = Math.min(1.0, confidence);
      // confidence is useless
      confidence = 1.0;
      const bbox = obstacle.bboxPoint;
      if (!obstacle.isPredictionDecision) {
        obstacle.existConfidenceColor = EXIST_CCONFIDENCE_COLOR[obstacle.existConfidence] || color;
      }
      if (bbox) {
        obstacle.bboxType = true;
      }
      // if (!obstacle.bboxType && obstacle.isPredictionDecision && !STORE.options.hideText) {
      //   this.addTextMesh('i', camera, EXIST_CCONFIDENCE_COLOR[obstacle.existConfidence], position, size, scene);
      // }

      if (obstacle.bboxType) {
        const boxMesh = this.addBbox({ length: obstacle.length, width: obstacle.width, height: obstacle.height}, bboxColor);
        boxMesh.rotation.x = Math.PI / 2;
        boxMesh.rotation.y = obstacle.heading;
        boxMesh.position.set(position.x, position.y, 0);
        scene.add(boxMesh);
        this.bboxList.push(boxMesh);
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

  findMaxKey(obj) {
    let maxKey = null;
    let maxValue = -Infinity;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] > maxValue) {
          maxValue = obj[key];
          maxKey = key;
        }
      }
    }

    return maxKey;
  }

  findBypassKey(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] > 0.5) {
          return key;
        }
      }
    }
    return 'IGNORE_LAT';
  }

  resetObjects(scene, empty) {
    if (!_.isEmpty(this.ids)) {
      this.ids.forEach((t) => {
        t.children.forEach((c) => c.visible = false);
        scene.remove(t);
      });
      this.ids = [];
    }

    this.interactLonBottomList.forEach((n) => {
      scene.remove(n);
      n.geometry.dispose();
      n.material.dispose();
    });
    this.interactLonBottomList = [];

    this.bboxList.forEach((n) => {
      scene.remove(n);
      n.geometry.dispose();
      n.material.dispose();
    });
    this.bboxList = [];

    this.textList.forEach((n) => {
      n.children.forEach((c) => {
        c.geometry.dispose();
        c.material.dispose();
      });
      scene.remove(n);
    });
    this.textList = [];

    this.textRender.reset();
    this.arrowIdx = 0;
    this.cubeIdx = 0;
    this.extrusionFaceIdx = 0;
    this.extrusionPncFaceIdx = 0;
    this.iconIdx = 0;
    this.trafficConeIdx = 0;
    this.v2xCubeIdx = 0;
    this.v2xSolidFaceIdx = 0;
    if (empty) {
      this.hideUnusedObjects();
    }
  }

  hideUnusedObjects() {
    hideArrayObjects(this.arrows, this.arrowIdx);
    hideArrayObjects(this.solidCubes, this.cubeIdx);
    hideArrayObjects(this.dashedCubes, this.cubeIdx);
    hideArrayObjects(this.extrusionSolidFaces, this.extrusionFaceIdx);
    hideArrayObjects(this.extrusionSolidFacesPnc, this.extrusionPncFaceIdx);
    hideArrayObjects(this.extrusionDashedFaces, this.extrusionFaceIdx);
    hideArrayObjects(this.icons, this.iconIdx);
    hideArrayObjects(this.trafficCones, this.trafficConeIdx);
    hideArrayObjects(this.v2xCubes, this.v2xCubeIdx);
    hideArrayObjects(this.v2xSolidFaces, this.v2xSolidFaceIdx);
  }

  updateArrow(position, heading, color, scene) {
    const arrowMesh = this.getArrow(this.arrowIdx, scene);
    copyProperty(arrowMesh.position, position);
    arrowMesh.material.color.setHex(color);
    arrowMesh.rotation.set(0, 0, -(Math.PI / 2 - heading));
    return arrowMesh;
  }

  updateTexts(adc, obstacle, obstaclePosition, scene, camera, size, isBirdView, isV2X) {
    if (obstacle.objectType === 'TYPE_STATIC_UNKNOWN' && !STORE.options.showPerceptionTypeStaticUnkonwn) {
      return;
    }

    const enterObstacleId = STORE.meters.enterObstacleId;
    if (enterObstacleId && obstacle.id !== enterObstacleId) {
      return;
    }

    const initPosition = {
      x: obstaclePosition.x,
      y: obstaclePosition.y,
      z: obstacle.height || 3,
    };

    const lineSpacing = 0.5;
    const deltaX = isBirdView ? 0.0 : lineSpacing * Math.cos(adc.heading);
    const deltaY = isBirdView ? 0.7 : lineSpacing * Math.sin(adc.heading);
    const deltaZ = isBirdView ? 0.0 : lineSpacing;
    let lineCount = 0;
    if (STORE.options.showObstaclesId) {
      if (!enterObstacleId || obstacle.id === enterObstacleId) {
        let text = `${obstacle.id}`;
        if (camera !== undefined && camera instanceof THREE.OrthographicCamera) {
          text = `${obstacle.id}`;
        }
        if (obstacle.topic === '/bev_object') {
          text = `${obstacle.id}`;
          if (obstacle.innerTypeId) {
            text = `${obstacle.innerTypeId}`;
          }
        }
        if (obstacle.deadCar || obstacle.isDeadCar) {
          this.addTextMesh(text, camera, 0xffffff, {x: initPosition.x, y: initPosition.y, z: initPosition.z}, size, scene);
        } else {
          this.drawTexts(text,
            initPosition,
            scene,
            camera,
            obstacle.isPncObject ? 0.8 : size,
            obstacle.isPncObject ? 0xFFA500 : 0xffff00);
        }
        lineCount++;
      }
    }
    if (STORE.options.showObstaclesInfo) {
      if (camera !== undefined && camera instanceof THREE.PerspectiveCamera) {
        const textPosition = {
          x: initPosition.x - (lineCount * deltaX),
          y: initPosition.y - (lineCount * deltaY),
          z: initPosition.z - (lineCount * deltaZ),
        };
        const speed = obstacle.speed.toFixed(1);
        if (!enterObstacleId || obstacle.id === enterObstacleId) {
          this.drawTexts(`${speed}`, textPosition, scene, camera, size, obstacle.isPncObject ? 0xFFA500 : 0xffff00);
          lineCount++;
        }
      }
    }
  }

  addBbox(vehicleParam, color = 0xffffff) {
    const backEdgeToCenter = vehicleParam.length / 2;
    const frontEdgeToCenter = vehicleParam.length / 2;
    const leftEdgeToCenter = vehicleParam.width / 2;
    const rightEdgeToCenter = vehicleParam.width / 2;
    const height = vehicleParam.height;
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -backEdgeToCenter, 0, leftEdgeToCenter,
      -backEdgeToCenter, 0, -rightEdgeToCenter,
      frontEdgeToCenter, 0, -rightEdgeToCenter,
      frontEdgeToCenter, 0, leftEdgeToCenter,
      frontEdgeToCenter, height, leftEdgeToCenter,
      frontEdgeToCenter, height, -rightEdgeToCenter,
      frontEdgeToCenter, 0, -rightEdgeToCenter,
      -backEdgeToCenter, 0, -rightEdgeToCenter,
      -backEdgeToCenter, height, -rightEdgeToCenter,
      frontEdgeToCenter, height, -rightEdgeToCenter,
      frontEdgeToCenter, height, leftEdgeToCenter,
      frontEdgeToCenter, 0, leftEdgeToCenter,
      -backEdgeToCenter, 0, leftEdgeToCenter,
      -backEdgeToCenter, height, leftEdgeToCenter,
      frontEdgeToCenter, height, leftEdgeToCenter,
      frontEdgeToCenter, height, -rightEdgeToCenter,
      -backEdgeToCenter, height, -rightEdgeToCenter,
      -backEdgeToCenter, height, leftEdgeToCenter,
    ]);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({
      color: color
    });
    const line = new THREE.Line(geometry, material);
    return line;
  }

  drawPredictionLine(points, coordinates, scene) {
    if (points && points.length) {
      const positions = coordinates.applyOffsetToArray(points);
      const mesh = drawSegmentsFromPoints(
        positions, 0x00FF3C, 2, 1,
      );
      this.bboxList.push(mesh);
      scene.add(mesh);
    }
  }

  handleRawCurbTags(efficientLaneChange, coordinates, scene) {
    const rawCurbTags = efficientLaneChange.rawCurbTags;
    if (_.isEmpty(rawCurbTags)) {return;}
    rawCurbTags.forEach(item => {
      item.points = [{x: item.curbStartX, y: item.curbStartY}, {x: item.curbEndX, y: item.curbEndY}];
      const positions = coordinates.applyOffsetToArray(item.points);
      const curbColor = 0xff0000;
      const mesh = drawSegmentsFromPoints(
        positions, curbColor, 2.5, 3
      );
      this.bboxList.push(mesh);
      scene.add(mesh);
    });
  }

  drawPlanningTrajectory(planningTrajectory, coordinates, scene) {
    if (_.isEmpty(planningTrajectory)) {return;}
    const pointList = coordinates.applyOffsetToArray(planningTrajectory);
    const mesh = drawSegmentsFromPoints(pointList, 0x00ffff, 4, 1);
    this.bboxList.push(mesh);
    scene.add(mesh);
  }

  getArrow(index, scene) {
    if (index < this.arrows.length) {
      return this.arrows[index];
    }
    const arrowMesh = drawArrow(1.2, LINE_THICKNESS, 0.25, 0.25, DEFAULT_COLOR);
    arrowMesh.rotation.set(0, 0, -Math.PI / 2);
    arrowMesh.visible = false;
    this.arrows.push(arrowMesh);
    scene.add(arrowMesh);
    return arrowMesh;
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
        this.ids.push(text);
        scene.add(text);
      }
    }
  }

  drawObstacleHeading(position, heading, scene) {
    const arrowMesh = this.updateArrow(position, heading, 0xFFFFFF, scene);
    arrowMesh.scale.set(1, 1, 1);
    arrowMesh.visible = true;
  }
}
