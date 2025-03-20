import * as THREE from 'three';
import STORE from 'store';
import { pointCloudColor } from 'utils/constant';

const MAX_POINTS = 200000;
const HEIGHT_COLOR_MAPPING = {
  0.5: 0xFF0000,
  1.0: 0xFF7F00,
  1.5: 0xFFFF00,
  2.0: 0x00FF00,
  2.5: 0x0000FF,
  3.0: 0x4B0082,
  10.0: 0x9400D3,
};

export default class PointCloud {
  constructor() {
    this.points = null;
    this.initialized = false;
  }

  initialize() {
    this.points = this.createPointCloud(HEIGHT_COLOR_MAPPING[0.5]);
    this.initialized = true;
  }

  createPointCloud(hex_color) {
    const geometry = new THREE.Geometry();
    const colors = [];
    for (let i = 0; i < MAX_POINTS; ++i) {
      const vertex = new THREE.Vector3();
      vertex.set(0, 0, -10);
      geometry.vertices.push(vertex);

      colors[i] = new THREE.Color(hex_color);
    }
    geometry.colors = colors;

    const material = new THREE.PointsMaterial({
      size: 0.05,
      transparent: false,
      opacity: 0.7,
      vertexColors: THREE.VertexColors,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
  }

  update(pointCloud, adcMesh) {
    if (this.points === null) {
      return;
    }
    const currentPointCloudColor = STORE.hmi.currentPointCloudColor;
    const currentPointCloudSize = STORE.hmi.currentPointCloudSize;
    // console.log('pointCloud = ', pointCloud);
    // console.log('pointCloud.num.length = ', pointCloud.num.length);
    if (pointCloud.num.length % 4 !== 0) {
      console.warn('PointCloud length should be multiples of 4!');
      return;
    }
    const pointCloudSize = pointCloud.num.length / 4;
    const total = (pointCloudSize < MAX_POINTS) ? pointCloudSize : MAX_POINTS;
    // console.log('pointCloudSize = ', pointCloudSize);
    // console.log('total = ', total);

    const intensityList = [];
    for (let i = 0; i < total; i++) {
      const intensity = pointCloud.num[i * 4 + 3];
      intensityList.push(intensity);
    }
    const maxIntensity = Math.max(...intensityList);
    const minIntensity = Math.min(...intensityList);
    const diffIntensity = maxIntensity - minIntensity;
    const range = Math.max(0.001, diffIntensity);
    // console.log('maxIntensity = ', maxIntensity);
    // console.log('minIntensity = ', minIntensity);
    // console.log('diffIntensity = ', diffIntensity);
    // console.log('range = ', range);


    let colorKey = 0.5;
    for (let i = 0; i < total; i++) {
      const x = pointCloud.num[i * 4];
      const y = pointCloud.num[i * 4 + 1];
      const z = pointCloud.num[i * 4 + 2];
      const intensity = pointCloud.num[i * 4 + 3];
      this.points.geometry.vertices[i].set(x, y, z + 0.3);
      // Update color based on height.
      if (currentPointCloudColor === '1') {
        if (z < 0.5) {
          colorKey = 0.5;
        } else if (z < 1.0) {
          colorKey = 1.0;
        } else if (z < 1.5) {
          colorKey = 1.5;
        } else if (z < 2.0) {
          colorKey = 2.0;
        } else if (z < 2.5) {
          colorKey = 2.5;
        } else if (z < 3.0) {
          colorKey = 3.0;
        } else {
          colorKey = 10.0;
        }
        this.points.geometry.colors[i].setHex(HEIGHT_COLOR_MAPPING[colorKey]);
      }

      if (currentPointCloudColor === '0') {
        let value = 1.0 - (intensity - minIntensity) / range;
        value = Math.min(value, 1.0);
        value = Math.max(0.0, value);
        const h = value * 5.0 + 1.0;
        const h_i = Math.floor(h);
        let h_f = h - h_i;
        if(!(h_i & 1)) {
          h_f = 1 - h_f;
        }
        const h_n = 1 - h_f;
        let r = 0, g = 0, b = 0;

        if(h_i <= 1) {
          r = h_n * 255;
          g = 0;
          b = 255;
        } else if(h_i === 2) {
          r = 0;
          g = h_n * 255;
          b = 255;
        } else if(h_i === 3) {
          r = 0;
          g = 255;
          b = h_n * 255;
        } else if(h_i === 4) {
          r = h_n * 255;
          g = 255;
          b = 0;
        } else if(h_i >= 5) {
          r = 255;
          g = h_n * 255;
          b = 0;
        }
        const hexColor = (r << 16) | (g << 8) | b;
        this.points.geometry.colors[i].setHex(hexColor);
      }

      if (currentPointCloudColor === '2') {
        this.points.geometry.colors[i].setHex(0xffffff);
      }
      if (currentPointCloudColor === '3') {
        const colorIndex = parseInt(intensity) > 254 ? 254 : parseInt(intensity);
        const rgbList = pointCloudColor[colorIndex];
        const red = rgbList[0] || 0;
        const green = rgbList[1];
        const blue = rgbList[2];
        const pointColor = (red << 16) | (green << 8) | blue;
        this.points.geometry.colors[i].setHex(pointColor);
      }
      // const rbgColor = `rgb(${r}, ${g}, ${b})`;
      // console.log('rbgColor = ', rbgColor);
      // console.log('hexColor = ', hexColor);
    }
    // Hide unused points.
    for (let i = total; i < MAX_POINTS; ++i) {
      this.points.geometry.vertices[i].set(0, 0, -10);
    }
    this.points.geometry.verticesNeedUpdate = true;
    this.points.geometry.colorsNeedUpdate = true;
    this.points.material.size = Number(currentPointCloudSize) || 0.05;
    this.points.position.set(adcMesh.position.x, adcMesh.position.y, adcMesh.position.z);
    this.points.rotation.set(0, 0, adcMesh.rotation.y);
  }
}
