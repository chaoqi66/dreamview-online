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
    this.zOffsetFactor = 6;

    this.textRender = new Text3D();

    this.ids = [];

    this.naviPoints = [];
  }

  disposeMeshes(scene) {
    this.naviPoints.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.naviPoints = [];

    this.ids.forEach((t) => {
      t.children.forEach((c) => c.visible = false);
      scene.remove(t);
    });
    this.ids = [];
    this.textRender.reset();
  }

  update(world, coordinates, scene, camera) {
    this.disposeMeshes(scene);

    const roadStructure = world.roadStructure;
    if (!_.isEmpty(roadStructure) && STORE.options.showNaviTwoKm) {
      roadStructure.naviRoadSet && this.addNaviRoadSet(roadStructure.naviRoadSet, coordinates, scene, camera);
    }

    if (STORE.options.showNaviSDTwoKm) {
      world.naviRoute && this.addNaviPoints(world.naviRoute, coordinates, scene);
    }
  }

  addNaviPoints(naviRoute, coordinates, scene) {
    let naviRouteList = null;
    if (naviRoute.naviRouteType === 1) {
      naviRouteList = naviRoute.naviRouteGd;
    }
    if (naviRoute.naviRouteType === 2) {
      naviRouteList = naviRoute.naviRouteBd;
    }
    const naviPoints = naviRouteList?.naviPointsOdom || [];
    if (_.isEmpty(naviPoints)) {
      return;
    }
    const list = [];
    for (let i = 0; i < naviPoints.length; i++) {
      const point = naviPoints[i];
      if (point.x && point.y) {
        point.z = 0;
        list.push(point);
      }
    }
    const points = coordinates.applyOffsetToArray(list);
    const mesh = drawSegmentsFromPoints(
      points, 0xff00ff, 2.5, this.zOffsetFactor, false,
    );
    scene.add(mesh);
    this.naviPoints.push(mesh);
  }

  addNaviRoadSet(naviRoadSet, coordinates, scene, camera) {
    if (_.isEmpty(naviRoadSet)) {
      return;
    }
    naviRoadSet.forEach(item => {
      const textPosition = coordinates.applyOffset(new THREE.Vector3(item.polyline.point[0]?.x,
        item.polyline.point[0]?.y, 3));
      this.drawTexts(
        `${item.id}`,
        textPosition,
        scene,
        camera,
        0.9,
        0x55ff00);

      const points = coordinates.applyOffsetToArray(item.polyline.point);
      const mesh = drawThickBandFromPoints(
        points, 0.5, 0xf3f300, 0.2, this.zOffsetFactor
      );
      // const mesh = drawSegmentsFromPoints(
      //   points, 0xf3f300, 2.5, this.zOffsetFactor, false,
      // );
      scene.add(mesh);
      this.naviPoints.push(mesh);
    });
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

  addLaneMesh(points, color, lineType) {
    switch (lineType) {
      case 'SOLID':
        return drawSegmentsFromPoints(
          points, color, 0.4, this.zOffsetFactor, false,
        );
      case 'DOTTED':
        return drawDashedLineFromPoints(
          points, color, 1.0, 0.5, 0.25, this.zOffsetFactor, 0.4, false,
        );
      default:
        return drawSegmentsFromPoints(
          points, color, 0.4, this.zOffsetFactor, false,
        );
    }
  }
}