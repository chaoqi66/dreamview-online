import * as THREE from 'three';
import _ from 'lodash';
import STORE from 'store';

import {
  drawSegmentsFromPoints,
  disposeMesh,
} from 'utils/draw';
import Text3D from 'renderer/text3d';
const topoColor = 0xfab9ff;
export default class TopoTree {
  constructor() {
    this.sphereList = [];
    this.edgeList = [];
    this.textList = [];
    this.textRender = new Text3D();
  }

  disposeMeshes(scene) {
    this.sphereList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.sphereList = [];

    this.edgeList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.edgeList = [];

    this.textList.forEach((t) => {
      t.children.forEach((c) => c.visible = false);
      scene.remove(t);
    });
    this.textList = [];
    this.textRender.reset();
  }

  updateTopoTree(world, coordinates, scene, camera) {
    this.disposeMeshes(scene);

    if (!STORE.options.showTopoTree) {
      return;
    }

    const topoTree = world.topoTree;
    if (_.isEmpty(topoTree)) {
      return;
    }

    topoTree.node && this.addNode(topoTree.node, coordinates, scene, camera);
    topoTree.edge && this.handleEdge(topoTree.edge, topoTree.node, coordinates, scene);
  }

  handleEdge(edge, node, coordinates, scene) {
    if (_.isEmpty(edge) || _.isEmpty(node)) {
      return;
    }
    edge.forEach(item => {
      const fromObj = node.find(obj => obj.id === item.fromId);
      const toObj = node.find(obj => obj.id === item.toId);
      if (fromObj && toObj) {
        const positions = coordinates.applyOffsetToArray([fromObj, toObj]);
        const mesh = drawSegmentsFromPoints(
          positions, topoColor, 3, 15
        );
        this.edgeList.push(mesh);
        scene.add(mesh);
      }
    });
  }

  addNode(node, coordinates, scene, camera) {
    if (_.isEmpty(node)) {
      return;
    }

    node.forEach(item => {
      const point = coordinates.applyOffset(item);
      if (item.type === 'LANE') {
        const text = `${item.id}` || '';
        this.drawTexts(
          text,
          point,
          scene,
          camera,
          1.0,
          topoColor);
      } else {
        this.drawSphere(point, scene);
      }
    });
  }

  drawTexts(content, position, scene, camera, size = 1.4, color = 0xFFEA00) {
    if (camera !== undefined) {
      const text = this.textRender.drawText(content, scene, camera, color, size);
      if (text) {
        text.position.set(position.x, position.y, 9 * 0.04);
        text.scale.set(size, size, 0);
        text.children.forEach((child) => {
          child.material.color.setHex(color);
        });
        this.textList.push(text);
        scene.add(text);
      }
    }
  }

  drawSphere(point, scene) {
    const geometry = new THREE.SphereGeometry(0.4, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: topoColor });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(point.x, point.y, 8 * 0.04);
    scene.add(sphere);
    this.sphereList.push(sphere);
  }
}