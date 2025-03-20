import * as THREE from 'three';
import STORE from 'store';
import _ from 'lodash';

import {
  drawSegmentsFromPoints,
  drawDashedLineFromPoints,
  drawCircle,
  disposeMesh,
} from 'utils/draw';

const colorMapping = {
  YELLOW: 0XDAA520,
  WHITE: 0xCCCCCC,
  CORAL: 0xFF7F50,
  RED: 0xFF6666,
  GREEN: 0x006400,
  BLUE: 0x30A5FF,
  PURE_WHITE: 0xFFFFFF,
  DEFAULT: 0xC0C0C0,
  PINK: 0xe5adf4,
  PURPLE: 0Xaa007f,
};


export default class PncNn {
  constructor() {
    this.laneList = [];
    this.intersectionList = [];
    this.laneCircles = [];
    this.groupLane = new THREE.Group();
    this.groupIntersection = new THREE.Group();
    this.groupOthers = new THREE.Group();
  }

  disposeMeshes(scene) {
    this.laneList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.laneList = [];
  }

  update(world, coordinates, scene) {
    this.disposeMeshes(scene);

    if (!STORE.options.showPncNnCanvas) {
      return;
    }
    const planningReferenceLane = world.planningReferenceLane;
    const autoDrivingCar = world.autoDrivingCar;
    coordinates.initialize(autoDrivingCar.positionX, autoDrivingCar.positionY);
    if (_.isEmpty(planningReferenceLane)) {
      return;
    }

    planningReferenceLane.lane && this.addCenterLane(planningReferenceLane.lane, scene, coordinates);
  }

  getLaneCircle() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: false,
      opacity: 0.8,
    });
    const circleMesh = drawCircle(0.8, material);
    this.laneCircles.push(circleMesh);
    return circleMesh;
  }

  addCenterLane(lane, scene, coordinates) {
    if (_.isEmpty(lane)) {
      return;
    }

    lane.forEach(item => {
      if (item.centerPointSet && item.centerPointSet.length) {
        const points = item.centerPointSet;
        const boundary = this.addLaneMesh(coordinates.applyOffsetToArray(points), colorMapping.YELLOW);
        this.laneList.push(boundary);
        scene.add(boundary);
      }
    });
  }

  addLaneMesh(points, color, lineType, lineWidth = 1) {
    switch (lineType) {
      case 'SOLID':
        return drawSegmentsFromPoints(
          points, color, lineWidth, 4, false,
        );
      case 'DOTTED':
        return drawDashedLineFromPoints(
          points, color, 1.0, 0.5, 0.25, 4, lineWidth, false,
        );
      default:
        return drawSegmentsFromPoints(
          points, color, lineWidth, 4, false,
        );
    }
  }
}