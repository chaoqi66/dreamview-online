import STORE from 'store';
import _ from 'lodash';

import {
  drawSegmentsFromPoints,
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
};


export default class PerceptioCurb {
  constructor() {
    this.laneList = [];
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

    if (!STORE.options.showCurbSet) {
      return;
    }

    const curbSet = world.curbSet;
    if (_.isEmpty(curbSet)) {
      return;
    }

    curbSet && this.addCurbSet(curbSet, coordinates, scene);
  }

  addCurbSet(curbSet, coordinates, scene) {
    if (_.isEmpty(curbSet)) {
      return;
    }

    curbSet.forEach(item => {
      if(item.vectorizedCurbOdom) {
        const points = coordinates.applyOffsetToArray(item.vectorizedCurbOdom);
        const boundary = drawSegmentsFromPoints(points, 0xffb534, 1.5, 0, false);
        scene.add(boundary);
        this.laneList.push(boundary);
      }
    });
  }
}