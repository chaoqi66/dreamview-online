import * as THREE from 'three';
import STORE from 'store';
import _ from 'lodash';
import Text3D from 'renderer/text3d';
import stright_forward_icon from 'assets/images/road_marker/stright_forward.png';
import left_icon from 'assets/images/road_marker/left.png';
import right_icon from 'assets/images/road_marker/right.png';
import left_forward_icon from 'assets/images/road_marker/left_forward.png';
import right_forward_icon from 'assets/images/road_marker/right_forward.png';
import left_right_forward_icon from 'assets/images/road_marker/left_right_forward.png';
import uturn_icon from 'assets/images/road_marker/uturn.png';
import uturn_right_icon from 'assets/images/road_marker/uturn_right.png';
import uturn_forward_icon from 'assets/images/road_marker/uturn_forward.png';
import uturn_left_icon from 'assets/images/road_marker/uturn_left.png';
import merge_left_icon from 'assets/images/road_marker/merge_left.png';
import merge_right_icon from 'assets/images/road_marker/merge_right.png';
import left_right_icon from 'assets/images/road_marker/left_right.png';
import stop_icon from 'assets/images/road_marker/stop.png';
import uturn_left_right_icon from 'assets/images/road_marker/uturn_left_right.png';
import { hideArrayObjects } from 'utils/misc';

import {
  drawImage,
  disposeMesh,
  drawSegmentsFromPoints,
} from 'utils/draw';

const colorMapping = {
  WHITE: 0xffffff,
  PINK: 0xff63c8,
  BLUE: 0x4829f4,
  WATHET: 0x39c2f4,
  RED: 0xff0000,
  GREEN: 0x008000,
  YELLOW: 0xFFFF00,
  ORANGE: 0xFFA500,
  BROWN: 0xA52A2A,
};

export default class PerceptionRoadStructure {
  constructor() {
    this.zOffsetFactor = 10;

    this.textRender = new Text3D();

    this.curbs = [];

    this.laneLineList = [];

    this.ids = [];

    this.stopLineList = [];

    this.manyMeshs = [];

    this.cacheRoadMarkers = {
      UNKNOWN_TYPE: [],
      STRIGHT_FORWARD: [],
      LEFT: [],
      RIGHT: [],
      LEFT_FORWARD: [],
      RIGHT_FORWARD: [],
      LEFT_RIGHT_FORWARD: [],
      UTURN: [],
      UTURN_RIGHT: [],
      UTURN_FORWARD: [],
      UTURN_LEFT: [],
      MERGE_LEFT: [],
      MERGE_RIGHT: [],
      LEFT_RIGHT: [],
      STOP: [],
      OTHERS: [],
      UTURN_LEFT_RIGHT: [],
    };
  }

  disposeMeshes(scene) {
    this.curbs.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.curbs = [];

    this.laneLineList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.laneLineList = [];

    this.stopLineList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.stopLineList = [];

    this.manyMeshs.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.manyMeshs = [];

    this.ids.forEach((t) => {
      t.children.forEach((c) => {
        c.geometry.dispose();
        c.material.dispose();
      });
      scene.remove(t);
    });
    this.ids = [];
    this.textRender.reset();

    for (const key in this.cacheRoadMarkers) {
      hideArrayObjects(this.cacheRoadMarkers[key].filter(Boolean));
    }
  }

  update(world, coordinates, scene) {
    this.disposeMeshes(scene);

    const slimRoadNet = world.slimRoadNet;
    const autoDrivingCar = world?.autoDrivingCar;
    if (_.isEmpty(slimRoadNet)) {
      return;
    }
    // lane/curb 精度是0.2  freeSpace/crosswalk/intersection精度是0.8
    if (STORE.options.showRoadNet && STORE.options.showRoadNetFreeSpace) {
      this.addFreeSpace(slimRoadNet.freeSpace, coordinates, autoDrivingCar, scene);
    }

    if (STORE.options.showRoadNet && STORE.options.showRoadNetIntersection) {
      this.addIntersection(slimRoadNet.intersection, coordinates, autoDrivingCar, scene);
    }

    if (STORE.options.showRoadNet && STORE.options.showRoadNetCrosswalk) {
      this.addCrosswalk(slimRoadNet.crosswalk, coordinates, autoDrivingCar, scene);
    }

    if (STORE.options.showRoadNet && STORE.options.showRoadNetLane) {
      this.addLaneLine(slimRoadNet.laneLine, coordinates, autoDrivingCar, scene);
    }

    if (STORE.options.showRoadNet && STORE.options.showRoadNetCurb) {
      this.addCurb(slimRoadNet.curb, coordinates, autoDrivingCar, scene);
    }

    if (STORE.options.showRoadNet && STORE.options.showRoadNetStopLine) {
      this.addStopLine(slimRoadNet.stopLine, coordinates, scene, autoDrivingCar);
    }

    if (STORE.options.showRoadNet) {
      this.addRoadMarker(slimRoadNet.roadMarker, coordinates, scene, autoDrivingCar);
    }
  }

  drawManyBox(list, coordinates, autoDrivingCar, size, boxColor, zOffset = 0.01) {
    const heading = autoDrivingCar?.heading || 0;
    const squareVertices = new Float32Array([
      -size / 2, -size / 2, 0, // 左下角
      size / 2, -size / 2, 0, // 右下角
      size / 2,  size / 2, 0, // 右上角
      -size / 2,  size / 2, 0  // 左上角
    ]);

    // 创建索引（两个三角形组成一个正方形）
    const squareIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    // 合并所有正方形的顶点和索引
    const instanceCount = list.length; // 正方形数量
    const vertices = new Float32Array(instanceCount * squareVertices.length);
    const indices = new Uint16Array(instanceCount * squareIndices.length);
    const colors = new Float32Array(instanceCount * 4 * 3); // 每个顶点一个颜色

    // 填充顶点、索引和颜色数据
    for (let i = 0; i < instanceCount; i++) {
      const item = list[i];
      const span = item.span;
      if (item && item.odomX && item.odomY) {
        const pos = coordinates.applyOffset({ x: item.odomX, y: item.odomY });
        const { x, y } = pos; // 从 list 获取坐标
        const color = new THREE.Color(span === 2 ? 0xff640b : boxColor);

        // 设置顶点位置
        for (let j = 0; j < squareVertices.length; j += 3) {
          const vx = squareVertices[j];
          const vy = squareVertices[j + 1];
          const cosTheta = Math.cos(heading);
          const sinTheta = Math.sin(heading);
          const rotatedX = vx * cosTheta - vy * sinTheta;
          const rotatedY = vx * sinTheta + vy * cosTheta;

          vertices[i * squareVertices.length + j] = rotatedX + x;
          vertices[i * squareVertices.length + j + 1] = rotatedY + y;
          vertices[i * squareVertices.length + j + 2] = zOffset;
        }

        // 设置索引
        for (let j = 0; j < squareIndices.length; j++) {
          indices[i * squareIndices.length + j] = squareIndices[j] + i * 4;
        }

        // 设置颜色
        for (let j = 0; j < 4; j++) {
          colors[i * 12 + j * 3] = color.r;
          colors[i * 12 + j * 3 + 1] = color.g;
          colors[i * 12 + j * 3 + 2] = color.b;
        }
      }

    }
    // 创建BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // 创建材质（启用顶点颜色）
    const material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      transparent: true,
      opacity: 0.2,
    });

    // 创建Mesh
    return new THREE.Mesh(geometry, material);
  }

  addLaneLine(laneLine = [], coordinates, autoDrivingCar, scene) {
    if (_.isEmpty(laneLine)) {
      return;
    }
    const mesh = this.drawManyBox(laneLine, coordinates, autoDrivingCar, 0.2, colorMapping.BLUE, 0.1);
    this.manyMeshs.push(mesh);
    scene.add(mesh);
  }

  addCurb(curbList = [], coordinates, autoDrivingCar, scene) {
    if (_.isEmpty(curbList)) {
      return;
    }
    const mesh = this.drawManyBox(curbList, coordinates, autoDrivingCar, 0.2, colorMapping.RED, 0.1);
    this.manyMeshs.push(mesh);
    scene.add(mesh);
  }


  addFreeSpace(freeSpaceList = [], coordinates, autoDrivingCar, scene) {
    if (_.isEmpty(freeSpaceList)) {
      return;
    }
    const mesh = this.drawManyBox(freeSpaceList, coordinates, autoDrivingCar, 0.8, colorMapping.WHITE);
    this.manyMeshs.push(mesh);
    scene.add(mesh);
  }

  addIntersection(intersectionList = [], coordinates, autoDrivingCar, scene) {
    if (_.isEmpty(intersectionList)) {
      return;
    }
    const mesh = this.drawManyBox(intersectionList, coordinates, autoDrivingCar, 0.8, colorMapping.WATHET, 0.05);
    this.manyMeshs.push(mesh);
    scene.add(mesh);
  }
  addCrosswalk(crosswalkList = [], coordinates, autoDrivingCar, scene) {
    if (_.isEmpty(crosswalkList)) {
      return;
    }
    const mesh = this.drawManyBox(crosswalkList, coordinates, autoDrivingCar, 0.8, colorMapping.GREEN, 0.08);
    this.manyMeshs.push(mesh);
    scene.add(mesh);
  }

  addStopLine(stopLine, coordinates, scene, autoDrivingCar) {
    if (_.isEmpty(stopLine)) {
      return;
    }
    stopLine.forEach(line => {
      if (line.length && line.angle && line.centerPoint) {
        const centerPoint = line.centerPoint;
        const pos = coordinates.applyOffset({ x: centerPoint.odomX, y: centerPoint.odomY });
        const offsetX = Math.cos(autoDrivingCar.heading + line.angle) * line.length / 2;
        const offsetY = Math.sin(autoDrivingCar.heading + line.angle) * line.length / 2;
        const startPoint = new THREE.Vector2(pos.x - offsetX, pos.y - offsetY);
        const endPoint = new THREE.Vector2(pos.x + offsetX, pos.y + offsetY);
        const mesh = drawSegmentsFromPoints(
          [startPoint, pos, endPoint], 0xffffff, 2, 8, false,
        );
        scene.add(mesh);
        this.stopLineList.push(mesh);
      }
    });
  }

  addRoadMarker(markerList, coordinates, scene, autoDrivingCar) {
    if (_.isEmpty(markerList)) {
      return;
    }
    const markerIdx = {
      UNKNOWN_TYPE: 0,
      STRIGHT_FORWARD: 0,
      LEFT: 0,
      RIGHT: 0,
      LEFT_FORWARD: 0,
      RIGHT_FORWARD: 0,
      LEFT_RIGHT_FORWARD: 0,
      UTURN: 0,
      UTURN_RIGHT: 0,
      UTURN_FORWARD: 0,
      UTURN_LEFT: 0,
      MERGE_LEFT: 0,
      MERGE_RIGHT: 0,
      LEFT_RIGHT: 0,
      STOP: 0,
      OTHERS: 0,
      UTURN_LEFT_RIGHT: 0,
    };
    markerList.forEach(roadMarker => {
      const { angle, position, type } = roadMarker;
      const pos = coordinates.applyOffset({ x: position.odomX, y: position.odomY });
      let icon = null;
      if (markerIdx[type] >= this.cacheRoadMarkers[type].length) {
        icon = this.getRoadMarkerIcon(type);
        scene.add(icon);
        this.cacheRoadMarkers[type].push(icon);
      } else {
        icon = this.cacheRoadMarkers[type][markerIdx[type]];
      }
      if (icon) {
        icon.position.set(pos.x, pos.y, 1);
        icon.rotation.set(0, 0, -Math.PI / 2 + autoDrivingCar.heading + angle);
        icon.visible = true;
      }
      markerIdx[type]++;
    });
  }

  getRoadMarkerIcon(type) {
    let img = null;
    switch (type) {
      case 'STRIGHT_FORWARD':
        img = stright_forward_icon;
        break;
      case 'LEFT':
        img = left_icon;
        break;
      case 'RIGHT':
        img = right_icon;
        break;
      case 'LEFT_FORWARD':
        img = left_forward_icon;
        break;
      case 'RIGHT_FORWARD':
        img = right_forward_icon;
        break;
      case 'LEFT_RIGHT_FORWARD':
        img = left_right_forward_icon;
        break;
      case 'UTURN':
        img = uturn_icon;
        break;
      case 'UTURN_RIGHT':
        img = uturn_right_icon;
        break;
      case 'UTURN_FORWARD':
        img = uturn_forward_icon;
        break;
      case 'UTURN_LEFT':
        img = uturn_left_icon;
        break;
      case 'MERGE_LEFT':
        img = merge_left_icon;
        break;
      case 'MERGE_RIGHT':
        img = merge_right_icon;
        break;
      case 'LEFT_RIGHT':
        img = left_right_icon;
        break;
      case 'STOP':
        img = stop_icon;
        break;
      case 'OTHERS':
        img = null;
        break;
      case 'UTURN_LEFT_RIGHT':
        img = uturn_left_right_icon;
        break;
      default:
        img = null;
        break;
    }
    if (img) {
      const icon = drawImage(img, 2, 4, 1, 1.6, 0, 0);
      return icon;
    }
    return null;
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
    this.ids.push(textMesh);
  }
}