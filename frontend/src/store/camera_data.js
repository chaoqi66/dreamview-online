import { observable, action } from 'mobx';
import * as THREE from 'three';
import { ObstacleTypeColorMap } from 'utils/constant';

export default class CameraData {
    @observable initPosition = observable.map();

    @observable deltaPosition = observable.map();

    @observable initStaticRotation = observable.map();

    @observable deltaStaticRotation = observable.map();

    @observable initDynamicRotation = observable.map();

    @observable deltaDynamicRotation = observable.map();

    @observable cameraChannels = [];

    @observable imageSrcData = null;

    @observable imageTimestamp = null;

    @observable deltaT1 = null;

    @observable deltaT2 = null;

    @observable imageAspectRatio = null;

    constructor() {
      ['x', 'y', 'z'].forEach((axis) => {
        this.initPosition.set(axis, 0);
        this.deltaPosition.set(axis, 0);
        this.initStaticRotation.set(axis, 0);
        this.deltaStaticRotation.set(axis, 0);
        this.initDynamicRotation.set(axis, 0);
        this.deltaDynamicRotation.set(axis, 0);
      });
    }

    getPositionAndRotationFromMatrix(matrix) {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      matrix.decompose(position, quaternion, scale);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);
      return { position, rotation: euler };
    }

    // The init camera data is being updated per frame
    @action init(data, coordinates) {
      // console.log('camera data');
      // console.log(data);
      // Camera image
      this.imageTimestamp = data.imageTimestamp;
      this.deltaT1 = (data.deltaT1 || data.deltaT1 === 0) ? data.deltaT1.toFixed(6) : '';
      this.deltaT2 = (data.deltaT2 || data.deltaT2 === 0) ? data.deltaT2.toFixed(6) : '';
      if (data && data.image) {
        this.imageSrcData = 'data:image/png;base64,' + data.image;
        this.imageAspectRatio = data.imageAspectRatio;
      } else {
        this.imageSrcData = '';
      }
      // 图片缩放比例
    }

    // The delta camera data can be updated by manual input
    @action update(type, key, value) {
      const deltaMap = this[`delta${type}`];
      if (deltaMap && deltaMap.has(key)) {
        deltaMap.set(key, deltaMap.get(key) + value);
      }
    }

    get() {
      const position = {};
      const staticRotation = {};
      const dynamicRotation = {};
      ['x', 'y', 'z'].forEach((axis) => {
        position[axis] = this.initPosition.get(axis) + this.deltaPosition.get(axis);
        staticRotation[axis] = this.initStaticRotation.get(axis)
                + this.deltaStaticRotation.get(axis);
        dynamicRotation[axis] = this.initDynamicRotation.get(axis)
                + this.deltaDynamicRotation.get(axis);
      });

      // Combine static and dynamic rotation to calculate overall rotation
      const staticQuaternion = new THREE.Quaternion();
      const staticEuler = new THREE.Euler(
        staticRotation.x, staticRotation.y, staticRotation.z,
      );
      staticQuaternion.setFromEuler(staticEuler);

      const dynamicQuaternion = new THREE.Quaternion();
      const dynamicEuler = new THREE.Euler(
        dynamicRotation.x, dynamicRotation.y, dynamicRotation.z,
      );
      dynamicQuaternion.setFromEuler(dynamicEuler);

      const overallQuaternion = new THREE.Quaternion();
      overallQuaternion.multiplyQuaternions(dynamicQuaternion, staticQuaternion);
      const rotation = new THREE.Euler().setFromQuaternion(overallQuaternion);

      return { position, rotation };
    }

    @action reset() {
      ['x', 'y', 'z'].forEach((axis) => {
        this.deltaPosition.set(axis, 0);
        this.deltaStaticRotation.set(axis, 0);
        this.deltaDynamicRotation.set(axis, 0);
      });
    }
}
