import STORE from 'store';
import _ from 'lodash';

import Text3D from 'renderer/text3d';
import carMaterial from 'assets/models/car.mtl';
import newCarMaterial from 'assets/models/new_car.mtl';
import carObject from 'assets/models/car.obj';
import iconRssUnsafe from 'assets/images/icons/rss-unsafe.png';
import { loadObject } from 'utils/models';
import { drawImage } from 'utils/draw';
import * as THREE from 'three';

const CAR_PROPERTIES = {
  adc: {
    menuOptionName: 'showPositionLocalization',
    carMaterial,
  },
  closeLoopAdc: {
    menuOptionName: 'showPositionCloseLoop',
    carMaterial: newCarMaterial,
  },
  planningAdc: {
    menuOptionName: 'showPlanningCar',
    carMaterial: null,
  },
  shadowAdc: {
    menuOptionName: 'showPositionShadow',
    carMaterial: null,
  },
};

const RSS_UNSAFE_MESH = drawImage(iconRssUnsafe, 1.5, 1.5);
const RSS_UNSAFE_MARKER_OFFSET = {
  x: 1,
  y: 1,
  z: 2.6,
};

export default class AutoDrivingCar {
  constructor(name, scene) {
    this.mesh = null;
    this.name = name;
    this.textRender = new Text3D();
    this.rssUnsafeMarker = RSS_UNSAFE_MESH;
    this.rssUnsafeMarker.visible = false;
    scene.add(this.rssUnsafeMarker);
    this.scene = scene;

    const properties = CAR_PROPERTIES[name];
    if (!properties) {
      console.error('Car properties not found for car:', name);
      return;
    }

    // NOTE: loadObject takes some time to update this.mesh.
    // This call is asynchronous.
    loadObject(properties.carMaterial, carObject, { x: 1, y: 1, z: 1 }, (object) => {
      this.mesh = object;
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.visible = false;
      scene.add(this.mesh);
    });
  }

  updateCarMesh(isBox = false, boxColor = 0xffffff, carType = 'adc') {
    const pos = {};
    if (this.mesh) {
      pos.x = this.mesh.position.x;
      pos.y = this.mesh.position.y;
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    if (isBox) {
      this.mesh = this.getGeometryBox(boxColor);
      this.mesh.visible = false;
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.set(pos.x, pos.y, 0);
      this.scene.add(this.mesh);
    } else {
      const properties = CAR_PROPERTIES[carType];
      if (!properties) {
        console.error('Car properties not found for car:');
        return;
      }
      loadObject(properties.carMaterial, carObject, { x: 1, y: 1, z: 1 }, (object) => {
        this.mesh = object;
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.visible = false;
        this.scene.add(this.mesh);
      }, true);
    }
  }

  getGeometryBox(boxColor) {
    const vehicleParam = STORE.hmi.vehicleParam;
    const scale = 0.82;
    const backEdgeToCenter = vehicleParam.backEdgeToCenter * scale;
    const frontEdgeToCenter = vehicleParam.frontEdgeToCenter * scale;
    const leftEdgeToCenter = vehicleParam.leftEdgeToCenter * scale;
    const rightEdgeToCenter = vehicleParam.rightEdgeToCenter * scale;
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
      color: boxColor //线条颜色
    });
    const line = new THREE.Line(geometry, material);
    return line;
  }

  update(coordinates, pose, world, scene) {
    if (!this.mesh || !pose || !_.isNumber(pose.positionX) || !_.isNumber(pose.positionY)) {
      return;
    }

    const optionName = CAR_PROPERTIES[this.name].menuOptionName;
    this.mesh.visible = STORE.options[optionName];
    const position = coordinates.applyOffset({ x: pose.positionX, y: pose.positionY });
    if (position === null) {
      return;
    }

    this.textRender.reset();
    this.updateTexts(world, position, scene);

    this.mesh.position.set(position.x, position.y, 0);
    this.mesh.rotation.y = pose.heading;
  }

  updateRssMarker(isRssSafe) {
    this.rssUnsafeMarker.visible = false;
    if (isRssSafe === false && STORE.options.showPlanningRSSInfo) {
      this.rssUnsafeMarker.position.set(this.mesh.position.x + RSS_UNSAFE_MARKER_OFFSET.x,
        this.mesh.position.y + RSS_UNSAFE_MARKER_OFFSET.y,
        this.mesh.position.z + RSS_UNSAFE_MARKER_OFFSET.z);
      this.rssUnsafeMarker.rotation.set(Math.PI / 2, this.mesh.rotation.y - Math.PI / 2, 0);
      this.rssUnsafeMarker.visible = true;
    }
  }

  resizeCarScale(x, y, z) {
    if (!this.mesh) {
      return;
    }
    this.mesh.scale.set(x, y, z);
  }

  updateTexts(world, position, scene) {
    const initPosition = {
      x: position.x,
      y: position.y,
      z: 3,
    };

    // const lineSpacing = 0.5;
    // const deltaX = isBirdView ? 0.0 : lineSpacing * Math.cos(pose.heading);
    // const deltaY = isBirdView ? 0.7 : lineSpacing * Math.sin(pose.heading);
    // const deltaZ = isBirdView ? 0.0 : lineSpacing;
    let lineCount = 0;
    if (STORE.options.showAdcLocalizationQuality) {
      const locQuality = world.locQuality ? world.locQuality.toFixed(1) : '';
      this.drawTexts(`(locQuality: ${locQuality})`, initPosition, scene);
      lineCount++;
    }
  }

  drawTexts(content, position, scene, color = 0xFFFFFF) {
    const text = this.textRender.drawText(content, scene, color);
    if (text) {
      text.position.set(position.x, position.y, position.z);
      // this.ids.push(text);
      scene.add(text);
    }
  }
}
