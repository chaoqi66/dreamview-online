import * as THREE from 'three';
import _ from 'lodash';
import STORE from 'store';
import { toJS } from 'mobx';
import { roundNumber } from 'utils/misc';

import {
  drawSegmentsFromPoints,
  drawDashedLineFromPoints,
  disposeMesh,
  drawCircle,
  drawHollowEllipse,
  drawThickBandFromPoints,
} from 'utils/draw';
import Text3D from 'renderer/text3d';

export default class BehaviorMap {
  constructor() {
    this.lineList = [];
    this.circles = [];
    this.textList = [];
    this.textRender = new Text3D();
    this.groupOthers = new THREE.Group();
  }

  disposeMeshes(scene) {
    this.lineList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.lineList = [];

    this.circles.forEach((c) => {
      scene.remove(c);
      disposeMesh(c);
    });
    this.circles = [];

    this.textList.forEach((t) => {
      t.children.forEach((c) => c.visible = false);
      scene.remove(t);
    });
    this.textList = [];
    this.textRender.reset();

    scene.remove(this.groupOthers);
    this.groupOthers.remove(...this.groupOthers.children);
  }

  update(world, coordinates, scene, camera) {
    this.disposeMeshes(scene);

    const behaviorMap = world?.behaviors || {};
    if (!STORE.options.showBehaviorMap) {
      return;
    }

    const roadList = world?.laneMap?.road || [];
    const laneList = world?.roadStructure?.laneSet || [];
    const behaviorMapSwitch = toJS(STORE.meters.behaviorMapSwitch);
    const autoDrivingCar = world?.autoDrivingCar;
    let lanePrefer = behaviorMap?.lanePrefer || [];
    lanePrefer = lanePrefer.filter(item => {
      return behaviorMapSwitch.lanePreferSwitch[item.id] === true;
    });
    let pathByLane = behaviorMap?.pathByLane || [];
    pathByLane = pathByLane.filter(item => {
      return behaviorMapSwitch.pathByLaneSwitch[item.id] === true;
    });
    let speedLimitByLane = behaviorMap?.speedLimitByLane || [];
    speedLimitByLane = speedLimitByLane.filter(item => {
      return behaviorMapSwitch.speedLimitByLaneSwitch[item.id] === true;
    });
    if (!_.isEmpty(lanePrefer)) {
      this.addLanePrefer(lanePrefer, laneList, roadList, scene, coordinates, camera, autoDrivingCar);
    }
    if (!_.isEmpty(pathByLane)) {
      this.addPathByLane(pathByLane, laneList, coordinates, camera, scene);
    }
    if (!_.isEmpty(speedLimitByLane)) {
      this.addSpeedLimitByLane(speedLimitByLane, laneList, coordinates, camera, scene);
    }
  }

  addLanePrefer(lanePrefer, laneList, roadList, scene, coordinates, camera, autoDrivingCar) {
    lanePrefer.forEach(item => {
      const circleMesh = this.getCircle();
      const position = coordinates.applyOffset(item.position);
      circleMesh.position.set(position.x, position.y, 0.24);
      scene.add(circleMesh);
      this.addTextMesh(`${item.id}`, camera, 0xffffff, {x: position.x, y: position.y, z: 5}, 1.0, scene, 3);
      const ellipse = drawHollowEllipse({ xRadius: item.radius, yRadius: item.radius, theta: 0 });
      ellipse.position.set(position.x, position.y, 0.24);
      scene.add(ellipse);
      this.lineList.push(ellipse);
      item.roadIds = item.roadIds || [];
      const selectedRoads = item.roadIds.map(r => {
        return { ...r, ...roadList[r.index] };
      });
      this.addRoad(selectedRoads, scene, camera, autoDrivingCar);

      item.laneScore = item.laneScore || [];
      const laneScore = item.laneScore.map(l => {
        return {...l, centerPointSet: laneList[l.index].centerPointSet };
      });
      laneScore.forEach(lane => {
        const points = coordinates.applyOffsetToArray(lane.centerPointSet || []);
        const initPosition = coordinates.applyOffset(
          new THREE.Vector3(lane.centerPointSet[Math.floor(lane.centerPointSet.length / 2)].x,
            lane.centerPointSet[Math.floor(lane.centerPointSet.length / 2)].y + 0.5, 3),
        );
        const boundary = drawThickBandFromPoints(
          points, 0.5, 0x3c76f4, 0.4, 10
        );
        scene.add(boundary);
        this.lineList.push(boundary);
        this.addTextMesh(`${lane.laneId}(${roundNumber(lane.score, 2)})`, camera, 0xffffff, {x: initPosition.x, y: initPosition.y, z: 5}, 1.0, scene, 3);
      });
    });
  }

  addPathByLane(pathByLane, laneList, coordinates, camera, scene) {
    pathByLane.forEach(item => {
      if (!_.isEmpty(item.path)) {
        const points = coordinates.applyOffsetToArray(item.path || []);
        const boundary = this.addLaneMesh(points, 0xffffff, 'SOLID', 1);
        scene.add(boundary);
        this.lineList.push(boundary);
      }
      item.laneIds = item.laneIds || [];
      const laneIds = item.laneIds.map(l => {
        return {...l, centerPointSet: laneList[l.index].centerPointSet };
      });
      laneIds.forEach(lane => {
        const points = coordinates.applyOffsetToArray(lane.centerPointSet || []);
        const initPosition = coordinates.applyOffset(
          new THREE.Vector3(lane.centerPointSet[Math.floor(lane.centerPointSet.length / 2)].x,
            lane.centerPointSet[Math.floor(lane.centerPointSet.length / 2)].y + 0.5, 3),
        );
        const boundary = drawThickBandFromPoints(
          points, 0.5, 0x3c76f4, 0.4, 10
        );
        scene.add(boundary);
        this.lineList.push(boundary);
        this.addTextMesh(`${lane.laneId}`, camera, 0xffffff, {x: initPosition.x, y: initPosition.y, z: 5}, 1.0, scene, 3);
      });
    });
  }

  addSpeedLimitByLane(speedLimitByLane, laneList, coordinates, camera, scene) {
    speedLimitByLane.forEach(item => {
      const circleMesh = this.getCircle();
      const position = coordinates.applyOffset(item.position);
      circleMesh.position.set(position.x, position.y, 0.24);
      circleMesh.material.color.setHex(0x3c76f4);
      scene.add(circleMesh);
      this.addTextMesh(`${item.id}(${item.speedLimit || ''})`, camera, 0xffffff, {x: position.x, y: position.y, z: 5}, 1.0, scene, 3);

      item.laneIds = item.laneIds || [];
      const laneIds = item.laneIds.map(l => {
        return {...l, centerPointSet: laneList[l.index].centerPointSet };
      });
      laneIds.forEach(lane => {
        const points = coordinates.applyOffsetToArray(lane.centerPointSet || []);
        const initPosition = coordinates.applyOffset(
          new THREE.Vector3(lane.centerPointSet[Math.floor(lane.centerPointSet.length / 3)].x,
            lane.centerPointSet[Math.floor(lane.centerPointSet.length / 3)].y + 0.5, 3),
        );
        const boundary = drawThickBandFromPoints(
          points, 0.5, 0xdc0ccb, 0.4, 10
        );
        scene.add(boundary);
        this.lineList.push(boundary);
        this.addTextMesh(`${lane.laneId}`, camera, 0xffffff, {x: initPosition.x, y: initPosition.y, z: 5}, 1.0, scene, 3);
      });
    });
  }

  addRoad(roads, scene, camera, autoDrivingCar) {
    if (_.isEmpty(roads)) {
      return;
    }
    roads.forEach(road => {
      const points = road?.polygon?.point || [];
      const boundary = drawThickBandFromPoints(
        points, 0.5, 0xff5500, 0.4, 10
      );

      const angle = autoDrivingCar.heading;
      this.groupOthers.add(boundary);
      const roadIdMesh = this.addTextMesh(`${road.roadId}`, camera, 0xffffff, {x: points[0].x, y: points[0].y, z: 5}, 1.0, scene, 3);
      this.groupOthers.add(roadIdMesh);
      this.groupOthers.rotation.z = angle;
      scene.add(this.groupOthers);
      if (camera !== undefined && camera.quaternion !== undefined) {
        roadIdMesh.quaternion.copy(camera.quaternion);
        roadIdMesh.rotation.z = Math.PI + angle;
      }
    });
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
    return textMesh;
  }

  addLaneMesh(points, color, lineType, lineWidth = 1) {
    switch (lineType) {
      case 'SOLID':
        return drawSegmentsFromPoints(
          points, color, lineWidth, 4, false, false, 0.1,
        );
      case 'DOTTED':
        return drawDashedLineFromPoints(
          points, color, 1.0, 0.5, 1, 4, lineWidth, false,
        );
      default:
        return drawSegmentsFromPoints(
          points, color, lineWidth, 4, false, false, 0.1
        );
    }
  }

  getCircle() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
    });
    const circleMesh = drawCircle(0.8, material);
    this.circles.push(circleMesh);
    return circleMesh;
  }
}