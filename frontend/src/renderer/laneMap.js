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
  RED: 0xf40202,
  GREEN: 0x006400,
  BLUE: 0x30A5FF,
  PURE_WHITE: 0xFFFFFF,
  DEFAULT: 0xC0C0C0,
  PINK: 0xe5adf4,
  PURPLE: 0Xaa007f,
};


export default class LaneMap {
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

    this.laneCircles.forEach((c) => {
      scene.remove(c);
      disposeMesh(c);
    });
    this.laneCircles = [];

    scene.remove(this.groupLane);
    this.groupLane.remove(...this.groupLane.children);
    scene.remove(this.groupIntersection);
    this.groupIntersection.remove(...this.groupIntersection.children);
    scene.remove(this.groupOthers);
    this.groupOthers.remove(...this.groupOthers.children);

    this.intersectionList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.intersectionList = [];
  }

  updateLaneMap(world, coordinates, scene) {
    this.disposeMeshes(scene);

    if (!STORE.options.showLaneMap) {
      return;
    }
    const laneMap = world.laneMap;
    const autoDrivingCar = world.autoDrivingCar;
    coordinates.initialize(autoDrivingCar.positionX, autoDrivingCar.positionY);
    if (_.isEmpty(laneMap)) {
      return;
    }

    laneMap.lane && this.addLane(laneMap.lane, scene, autoDrivingCar);
    laneMap.intersection && this.addIntersection(laneMap.intersection, scene, autoDrivingCar);
    laneMap.stopline && this.addStopLine(laneMap.stopline, scene, autoDrivingCar);
    laneMap.crosswalk && this.addCrosswalk(laneMap.crosswalk, scene, autoDrivingCar);
    laneMap.unstructuredArea && this.addUnstructuredArea(laneMap.unstructuredArea, scene, autoDrivingCar);
    laneMap.m2n && this.addM2n(laneMap.m2n, scene, autoDrivingCar);
    laneMap.road && this.addRoad(laneMap.road, scene, autoDrivingCar);
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

  addLane(lane, scene, autoDrivingCar) {
    if (_.isEmpty(lane)) {
      return;
    }

    lane.forEach(item => {
      if(item.skeleton) {
        let laneColor = colorMapping.YELLOW;
        if (item.topoFiltered) {
          laneColor = colorMapping.WHITE;
        }
        const points = item.skeleton.point;
        const angle = autoDrivingCar.heading;
        if (!item.topoFiltered && item.cutoff) {
          const cutoffStartIndex = item.cutoffStartIndex;
          const cutoffEndIndex = item.cutoffEndIndex;
          if (cutoffStartIndex === 0) {
            const yellowPart = points.slice(0, cutoffEndIndex + 1);
            const whitePart = points.slice(cutoffEndIndex);
            const boundary1 = this.addLaneMesh(yellowPart, colorMapping.YELLOW);
            const boundary2 = this.addLaneMesh(whitePart, colorMapping.WHITE);
            this.groupLane.add(boundary1);
            this.groupLane.add(boundary2);
            this.laneList.push(boundary1);
            this.laneList.push(boundary2);
            if (cutoffEndIndex < points.length - 1) {
              const circleMesh = this.getLaneCircle();
              circleMesh.position.set(points[cutoffEndIndex].x, points[cutoffEndIndex].y, 4);
              this.groupLane.add(circleMesh);
            }
          }
          if (cutoffStartIndex > 0) {
            const whitePart1 = points.slice(0, cutoffStartIndex + 1);
            const yellowPart = points.slice(cutoffStartIndex, cutoffEndIndex + 1);
            const whitePart2 = points.slice(cutoffEndIndex);
            const boundary1 = this.addLaneMesh(yellowPart, colorMapping.YELLOW);
            const boundary2 = this.addLaneMesh(whitePart1, colorMapping.WHITE);
            const boundary3 = this.addLaneMesh(whitePart2, colorMapping.WHITE);
            this.groupLane.add(boundary1);
            this.groupLane.add(boundary2);
            this.groupLane.add(boundary3);
            this.laneList.push(boundary1);
            this.laneList.push(boundary2);
            this.laneList.push(boundary3);

            const circleMesh = this.getLaneCircle();
            circleMesh.position.set(points[cutoffStartIndex].x, points[cutoffStartIndex].y, 4);
            this.groupLane.add(circleMesh);
            const circleMesh2 = this.getLaneCircle();
            circleMesh2.position.set(points[cutoffEndIndex].x, points[cutoffEndIndex].y, 4);
            this.groupLane.add(circleMesh2);
          }
        } else {
          const boundary = this.addLaneMesh(points, laneColor);
          this.groupLane.add(boundary);
          this.laneList.push(boundary);
        }
        this.groupLane.rotation.z = angle;
        scene.add(this.groupLane);
      }
    });
  }

  addRoad(road, scene, autoDrivingCar) {
    if (_.isEmpty(road)) {
      return;
    }
    road.forEach(item => {
      const points = item?.polygon?.point || [];
      const lineType = item.topoFiltered === true ? 'DOTTED' : 'SOLID';
      const boundary = this.addLaneMesh(points, colorMapping.RED, lineType);

      const angle = autoDrivingCar.heading;
      this.groupOthers.add(boundary);
      this.groupOthers.rotation.z = angle;
      scene.add(this.groupOthers);
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
          points, color, 1.0, 0.5, 1, 4, lineWidth, false,
        );
      default:
        return drawSegmentsFromPoints(
          points, color, lineWidth, 4, false,
        );
    }
  }

  addIntersection(intersection, scene, autoDrivingCar) {
    if (_.isEmpty(intersection)) {
      return;
    }

    intersection.forEach(item => {
      if (item.polygon) {
        const points = item.polygon.point;
        let mesh = null;
        if (item.topoFiltered) {
          mesh = drawDashedLineFromPoints(points, colorMapping.BLUE, 1.0, 0.5, 0.25, 4, 0.4, false);
        } else {
          mesh = drawSegmentsFromPoints(points, colorMapping.BLUE, 0.4, 4, false);
        }
        const angle = autoDrivingCar.heading;
        this.groupIntersection.add(mesh);
        this.groupIntersection.rotation.z = angle;
        scene.add(this.groupIntersection);
        this.intersectionList.push(mesh);
      }
    });
  }

  addStopLine(stopline, scene, autoDrivingCar) {
    if (_.isEmpty(stopline)) {
      return;
    }
    stopline.forEach(item => {
      const points = item?.line?.point || [];
      const lineType = item.topoFiltered === true ? 'DOTTED' : 'SOLID';
      const boundary = this.addLaneMesh(points, colorMapping.CORAL, lineType);

      const angle = autoDrivingCar.heading;
      this.groupOthers.add(boundary);
      this.groupOthers.rotation.z = angle;
      scene.add(this.groupOthers);
    });
  }

  addCrosswalk(crosswalk, scene, autoDrivingCar) {
    if (_.isEmpty(crosswalk)) {
      return;
    }
    crosswalk.forEach(item => {
      if (item.polygon) {
        const points = item.polygon.point;
        const lineType = item.topoFiltered === true ? 'DOTTED' : 'SOLID';
        const mesh = this.addLaneMesh(points, colorMapping.GREEN, lineType);
        const angle = autoDrivingCar.heading;
        this.groupOthers.add(mesh);
        this.groupOthers.rotation.z = angle;
        scene.add(this.groupOthers);
      }
    });
  }

  addUnstructuredArea(unstructuredArea, scene, autoDrivingCar) {
    if (_.isEmpty(unstructuredArea)) {
      return;
    }
    unstructuredArea.forEach(item => {
      if (item.polygon) {
        const points = item.polygon.point;
        const lineType = item.topoFiltered === true ? 'DOTTED' : 'SOLID';
        const mesh = this.addLaneMesh(points, colorMapping.PINK, lineType);
        const angle = autoDrivingCar.heading;
        this.groupOthers.add(mesh);
        this.groupOthers.rotation.z = angle;
        scene.add(this.groupOthers);
      }
    });
  }
  addM2n(m2n, scene, autoDrivingCar) {
    if (_.isEmpty(m2n)) {
      return;
    }
    m2n.forEach(item => {
      if (item.polygon) {
        const points = item.polygon.point;
        const lineType = item.topoFiltered === true ? 'DOTTED' : 'SOLID';
        const mesh = this.addLaneMesh(points, colorMapping.PURPLE, lineType);
        const angle = autoDrivingCar.heading;
        this.groupOthers.add(mesh);
        this.groupOthers.rotation.z = angle;
        scene.add(this.groupOthers);
      }
    });
  }
}