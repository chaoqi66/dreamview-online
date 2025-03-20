import * as THREE from 'three';
import STORE from 'store';
import _ from 'lodash';
import Text3D from 'renderer/text3d';

import {
  drawSegmentsFromPoints,
  drawDashedLineFromPoints,
  drawThickBandFromPoints,
  disposeMesh,
} from 'utils/draw';

export default class NaviTwoKm {
  constructor() {
    this.zOffsetFactor = 10;
    this.textRender = new Text3D();
    this.carHistoryMesh = null;
  }

  update(list, coordinates, scene) {
    this.updateCarHistory(list, coordinates, scene);
  }

  updateCarHistoryMesh() {
    if (!this.carHistoryMesh) {
      return;
    }
    if (STORE.options.showAutoCarHistory) {
      this.carHistoryMesh.visible = true;
    } else {
      this.carHistoryMesh.visible = false;
    }
  }

  updateCarHistory(list, coordinates, scene) {
    const pos = list.filter(item => item.x && item.y);
    const positions = coordinates.applyOffsetToArray(pos);
    this.carHistoryMesh = drawSegmentsFromPoints(positions, 0x00ff00, 4.2, this.zOffsetFactor, false);
    this.carHistoryMesh.visible = false;
    scene.add(this.carHistoryMesh);
    this.updateCarHistoryMesh();
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