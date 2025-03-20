import * as THREE from 'three';
import _ from 'lodash';
import Text3D from 'renderer/text3d';

import {
  drawSegmentsFromPoints,
  drawCircle,
  disposeMesh
} from 'utils/draw';
import STORE from 'store/';

export default class Distance {
  constructor() {
    this.zOffsetFactor = 0.24;
    this.lineList = [];
    this.predCircles = [];
    this.ids = [];
    this.textRender = new Text3D();
  }

  disposeMeshes(scene) {
    this.predCircles.forEach((c) => {
      scene.remove(c);
      disposeMesh(c);
    });
    this.predCircles = [];

    this.lineList.forEach((c) => {
      scene.remove(c);
      disposeMesh(c);
    });
    this.lineList = [];

    this.ids.forEach((t) => {
      t.children.forEach((c) => c.visible = false);
      scene.remove(t);
    });
    this.ids = [];
    this.textRender.reset();

    STORE.meters.updateDistanceList([]);
  }

  update(distanceList, coordinates, scene, camera) {
    if (_.isEmpty(distanceList)) {
      return;
    }
    this.addDistanceMesh(distanceList, coordinates, scene, camera);
  }

  addDistanceMesh(distanceList, coordinates, scene, camera) {
    const distanceListReal = [];
    for (let i = 0; i < distanceList.length; i = i + 2) {
      const startCoord = distanceList[i] ? coordinates.applyOffset(distanceList[i]) : null;
      const endCoord = distanceList[i + 1] ? coordinates.applyOffset(distanceList[i + 1]) : null;
      distanceListReal.push({ start: startCoord, end: endCoord });
    }
    distanceListReal.forEach((item, index) => {
      if (item.start) {
        const circleMeshStart = this.getPredCircle();
        circleMeshStart.position.set(item.start.x, item.start.y, 0.24);
        scene.add(circleMeshStart);
        if (item.end) {
          const circleMeshEnd = this.getPredCircle();
          circleMeshEnd.position.set(item.end.x, item.end.y, 0.24);
          scene.add(circleMeshEnd);

          const boundary = drawSegmentsFromPoints(
            [item.start, item.end], 'blue', 1.5, this.zOffsetFactor, false,
          );
          scene.add(boundary);
          this.lineList.push(boundary);

          this.drawTexts(
            `${index}`,
            new THREE.Vector3(item.start.x, item.start.y, 0),
            scene,
            camera,
            0.9,
            0xffff00);
        }
      }
    });
  }

  getPredCircle() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
    });
    const circleMesh = drawCircle(0.02, material);
    this.predCircles.push(circleMesh);
    return circleMesh;
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
}