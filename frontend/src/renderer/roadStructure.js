import * as THREE from 'three';
import STORE from 'store';
import _ from 'lodash';
import Text3D from 'renderer/text3d';
import uturn_icon from 'assets/images/road_marker/uturn.png';
import { hideArrayObjects } from 'utils/misc';

import {
  drawSegmentsFromPoints,
  drawDashedLineFromPoints,
  drawShapeFromPoints,
  drawImage,
  disposeMesh,
  drawHollowBox,
} from 'utils/draw';

const colorMapping = {
  YELLOW: 0XDAA520,
  WHITE: 0xCCCCCC,
  CORAL: 0xFF7F50,
  RED: 0xFF6666,
  GREEN: 0x006400,
  BLUE: 0x30A5FF,
  PURE_WHITE: 0xFFFFFF,
  BLACK: 0x000000,
  GREY: 0x878787,
  DEFAULT: 0xC0C0C0,
};

const turnTypeMap = {
  '-1': 'N',
  '0': 'X',
  '1': 'L',
  '2': 'R',
  '3': 'F',
  '4': 'U'
};

// 左蓝右红中间黄
const laneTypeColorMapping = {
  'centerPointSet': colorMapping.YELLOW,
  'leftBoundaryPointSet': colorMapping.BLUE,
  'rightBoundaryPointSet': colorMapping.RED
};
const laneTypeList = Object.keys(laneTypeColorMapping);
const boundaryWidth = 1.5;
const BARRIER_TEXTS = {
  'BARRIER_UNKNOWN': 'UNKNOWN',
  'STRAIGHT_ARM_BARRIER': 'straight',
  'FOLDING_ARM_BARRIER': 'folding',
  'FENCE_ARM_BARRIER': 'fence',
  'BOLLARDS': 'bollards',
};

export default class RoadStructure {
  constructor() {
    this.zOffsetFactor = 10;

    this.textRender = new Text3D();

    this.roadLines = [];

    this.roadCurbs = [];

    this.intersectionList = [];

    this.ids = [];

    this.curbSet = [];

    this.vectorizedLanelineSet = [];

    this.stopLineList = [];

    this.cacheRoadMarkers = {
      TURN_AROUND: [],
    };
  }

  disposeMeshes(scene) {
    this.roadLines.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.roadLines = [];

    this.roadCurbs.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.roadCurbs = [];

    this.intersectionList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.intersectionList = [];

    this.vectorizedLanelineSet.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.vectorizedLanelineSet = [];

    this.stopLineList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.stopLineList = [];

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

  update(world, coordinates, scene, camera) {
    this.disposeMeshes(scene);

    const roadStructure = world.roadStructure;
    if (STORE.options.showRoadStructureCurb) {
      roadStructure.curbSet && this.addCurbSet(roadStructure.curbSet, coordinates, scene);
    }
    if (world.multiFrameLane && STORE.options.showRdMultiLane) {
      this.addMultiFrameLane(world.multiFrameLane, coordinates, scene);
    }
    if (!STORE.options.showRoadStructure) {
      return;
    }
    if (_.isEmpty(roadStructure)) {
      return;
    }

    this.addLane(roadStructure.laneSet, coordinates, scene, camera);
    this.addCurbs(roadStructure.curbs, coordinates, scene);
    roadStructure.intersectionSet && this.addIntersection(roadStructure.intersectionSet, coordinates, scene);
    roadStructure.crosswalkSet && this.addCrosswalkSet(roadStructure.crosswalkSet, coordinates, scene);
    if (STORE.options.showVectorizedLane && roadStructure.vectorizedLanelineSet) {
      this.addVectorizedLanelineSet(roadStructure.vectorizedLanelineSet, coordinates, scene);
    }
    if (STORE.options.showWorldBarrier && roadStructure?.barrierSet) {
      this.addBarrierSet(roadStructure.barrierSet, coordinates, scene, camera);
    }
  }

  addBarrierSet(barrierSet, coordinates, scene, camera) {
    if (!_.isEmpty(barrierSet)) {
      barrierSet.forEach(item => {
        if (item && item.start && item.end) {
          const startPoint = coordinates.applyOffset({ x: item.start.odomX, y: item.start.odomY });
          const endPoint = coordinates.applyOffset({ x: item.end.odomX, y: item.end.odomY });
          const midPoint = new THREE.Vector2((startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2);
          const pointA = new THREE.Vector2(startPoint.x, startPoint.y);
          const pointB = new THREE.Vector2(endPoint.x, endPoint.y);
          const vector = pointB.clone().sub(pointA);
          const angle = vector.angle();
          const length = pointA.distanceTo(pointB);
          const boxMesh = drawHollowBox({ length: length, width: 0.1, height: 0.5}, 0xff0000);
          boxMesh.rotation.z = angle;
          const pitch = item?.pitch || 0;
          boxMesh.updateMatrixWorld();
          const rotationMatrix = new THREE.Matrix4().makeRotationY(-pitch);
          boxMesh.matrixWorld.multiply(rotationMatrix);
          boxMesh.rotation.setFromRotationMatrix(boxMesh.matrixWorld);
          boxMesh.position.set(startPoint.x, startPoint.y, 1);
          scene.add(boxMesh);
          this.intersectionList.push(boxMesh);

          const text = BARRIER_TEXTS[item.type] || '';
          text && this.addTextMesh(text, {x: midPoint.x, y: midPoint.y, z: 1}, scene, camera, 0.6, 0xff0000);
        }
      });
    }
  }

  addVectorizedLanelineSet(vectorizedLanelineSet, coordinates, scene) {
    if (_.isEmpty(vectorizedLanelineSet)) {
      return;
    }

    vectorizedLanelineSet.forEach(item => {
      if (!item.vectorizedLaneline) {
        return;
      }
      const points = coordinates.applyOffsetToArray(item.vectorizedLaneline);
      const mesh = drawSegmentsFromPoints(
        points, colorMapping.DEFAULT, 1, this.zOffsetFactor, false,
      );
      scene.add(mesh);
      this.vectorizedLanelineSet.push(mesh);
    });
  }

  addCrosswalkSet(crosswalkSet, coordinates, scene) {
    if (_.isEmpty(crosswalkSet)) {
      return;
    }

    crosswalkSet.forEach(item => {
      if (item.boundary && item.boundary.points) {
        const points = coordinates.applyOffsetToArray(item.boundary.points);
        const mesh = drawSegmentsFromPoints(
          points, 0x00FF00, 0.2, this.zOffsetFactor, false,
        );
        scene.add(mesh);
        this.roadCurbs.push(mesh);
      }
    });
  }

  addCurbSet(curbSet, coordinates, scene) {
    if (_.isEmpty(curbSet)) {
      return;
    }

    curbSet.forEach(item => {
      if (item.vectorizedCurb) {
        const points = coordinates.applyOffsetToArray(item.vectorizedCurb);
        const mesh = drawSegmentsFromPoints(
          points, 0xffaaff, 2.5, this.zOffsetFactor, false,
        );
        scene.add(mesh);
        this.roadCurbs.push(mesh);
      }
    });
  }

  addIntersection(intersection, coordinates, scene) {
    if (_.isEmpty(intersection)) {
      return;
    }

    if (intersection[0].pdIntersection === undefined) {
      this.addIntersectionByType(intersection, coordinates, scene);
      return;
    }

    const pdLaneList = [];
    const visibleLaneList = [];
    const naviLaneList = [];
    const otherLaneList = [];

    intersection.forEach(item => {
      if (item.pdIntersection) {
        pdLaneList.push(item);
      }
      if (item.visibleIntersection) {
        visibleLaneList.push(item);
      }
      if (item.naviIntersection) {
        naviLaneList.push(item);
      }
      if (!item.pdIntersection && !item.visibleIntersection && !item.naviIntersection) {
        otherLaneList.push(item);
      }
    });

    if (STORE.options.showPdLane) {
      this.addIntersectionByType(pdLaneList, coordinates, scene);
    }
    if (STORE.options.showVisibleLane) {
      this.addIntersectionByType(visibleLaneList, coordinates, scene);
    }
    if (STORE.options.showNaviLane) {
      this.addIntersectionByType(naviLaneList, coordinates, scene);
    }
    if (STORE.options.showOtherLane) {
      this.addIntersectionByType(otherLaneList, coordinates, scene);
    }
  }

  addIntersectionByType(intersection, coordinates, scene) {
    if (_.isEmpty(intersection)) {
      return;
    }

    intersection.forEach(item => {
      if (item.boundary) {
        const points = coordinates.applyOffsetToArray(item.boundary.points);
        const mesh = drawSegmentsFromPoints(points, colorMapping.BLUE, 0.4, 0, false);
        scene.add(mesh);
        this.intersectionList.push(mesh);
      }
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

  addMultiFrameLane(multiFrameLane, coordinates, scene) {
    if (multiFrameLane.followingLanes) {
      const multiFrameLaneNum = STORE.meters.multiFrameLane;
      const followLane = multiFrameLane?.followingLanes?.navigationLane || [];
      const preLane = multiFrameLane?.previousLanes?.navigationLane || [];
      const allLanes = [...preLane, ...followLane];
      for (let i = 0; i < allLanes.length; i++) {
        if (i > multiFrameLaneNum.end || i < multiFrameLaneNum.start) {
          continue;
        }
        const item = allLanes[i];
        const points = coordinates.applyOffsetToArray(item.centerPointSet || []);
        const boundary = this.addLaneMesh(points, 0xffffff, 'SOLID' ,1);
        scene.add(boundary);
        this.roadLines.push(boundary);
      }
    }
  }

  addLane(laneSet, coordinates, scene, camera) {
    if (_.isEmpty(laneSet)) {
      return;
    }
    if (laneSet[0].pdLane === undefined) {
      this.addLaneByType(laneSet, coordinates, scene, camera);
      return;
    }
    const pdLaneList = [];
    const visibleLaneList = [];
    const naviLaneList = [];
    const otherLaneList = [];
    const markerIdx = {
      TURN_AROUND: 0,
    };
    laneSet.forEach((lane) => {
      if (lane.pdLane) {
        this.handleMarkers(lane, scene, markerIdx, coordinates);
        pdLaneList.push(lane);
      }
      if (lane.visibleLane) {
        this.handleMarkers(lane, scene, markerIdx, coordinates);
        visibleLaneList.push(lane);
      }
      if (lane.naviLane) {
        this.handleMarkers(lane, scene, markerIdx, coordinates);
        naviLaneList.push(lane);
      }
      if (!lane.pdLane && !lane.visibleLane && !lane.naviLane) {
        otherLaneList.push(lane);
      }
    });
    if (STORE.options.showPdLane) {
      this.addLaneByType(pdLaneList, coordinates, scene, camera, 'pdLane');
    }
    if (STORE.options.showVisibleLane) {
      this.addLaneByType(visibleLaneList, coordinates, scene, camera, 'visibleLane');
    }
    if (STORE.options.showNaviLane) {
      this.addLaneByType(naviLaneList, coordinates, scene, camera, 'naviLane');
    }
    if (STORE.options.showOtherLane) {
      this.addLaneByType(otherLaneList, coordinates, scene, camera, 'otherLane');
    }
  }

  getPointsByCutoff(list) {
    const resultArray = [];
    let tempArray = [];
    list.forEach(obj => {
      if (obj.cutoff === false) {
        tempArray.push(obj);
      } else if (tempArray.length > 0) {
        resultArray.push(tempArray);
        tempArray = [];
      }
    });
    if (tempArray.length > 0) {
      resultArray.push(tempArray);
    }
    return resultArray;
  }

  addLaneByType(laneSet, coordinates, scene, camera, laneRelatedType) {
    if (_.isEmpty(laneSet)) {
      return;
    }
    laneSet.forEach(lane => {
      laneTypeList.forEach((laneType) => {
        let pointSet = lane[laneType] || [];

        if (!_.isEmpty(pointSet)) {
          if (!STORE.options.showTurningline && (lane.laneCategory === 'INTERSECTION_VIRTUAL' || lane.laneCategory === 'M2N_VIRTUAL')) {
            return;
          }
          if (laneType === 'centerPointSet') {
            if (pointSet) {
              pointSet = pointSet.filter(item => {
                if (!item.x || !item.y) {
                  return false;
                }
                if (STORE.options.showRangeView && item.distance && item.distance > STORE.meters.autoRange) {
                  return false;
                }
                return true;
              });
            }
            if (!pointSet.length) {
              return;
            }
            if (lane.isCutoff && pointSet[0].cutoff !== undefined && laneRelatedType !== 'naviLane') {
              const points = this.getPointsByCutoff(pointSet);
              points.forEach((subPoints) => {
                const boundary = this.addLaneMesh(coordinates.applyOffsetToArray(subPoints), laneTypeColorMapping[laneType], 'SOLID' ,0.5);
                scene.add(boundary);
                this.roadLines.push(boundary);
              });
            } else {
              const points = coordinates.applyOffsetToArray(pointSet);
              const boundary = this.addLaneMesh(points, laneTypeColorMapping[laneType], 'SOLID', 0.5);
              scene.add(boundary);
              this.roadLines.push(boundary);
            }
            const initPosition = coordinates.applyOffset(
              new THREE.Vector3(pointSet[Math.floor(pointSet.length / 2)].x,
                pointSet[Math.floor(pointSet.length / 2)].y + 0.5, 3),
            );
            const endPosition = coordinates.applyOffset(
              new THREE.Vector3(pointSet[Math.floor(pointSet.length - 1)].x,
                pointSet[Math.floor(pointSet.length - 1)].y + 0.5, 3),
            );
            if (lane.laneCategory === 'REALITY') {
              if (STORE.options.showLaneId) {
                this.drawTexts(
                  `${lane.laneId}`,
                  initPosition,
                  scene,
                  camera,
                  0.9,
                  0xffff00);
              }
              if (!STORE.options.hideText) {
                let curLaneType = '';
                let maxPiece = 0;
                for (let i = 5; i < pointSet.length; i++) {
                  if (curLaneType === pointSet[i].laneType && maxPiece <= 25) {
                    maxPiece++;
                    continue;
                  }
                  maxPiece = 0;
                  curLaneType = pointSet[i].laneType;
                  const pos = coordinates.applyOffset(
                    new THREE.Vector3(pointSet[i].x,
                      pointSet[i].y + 0.5, 3),
                  );
                  if (!pointSet[i].cutoff && ['RL', 'BUS', 'TIDAL'].includes(curLaneType)) {
                    if (i <= pointSet.length) {
                      this.addTextMesh(
                        `${curLaneType}`,
                        pos,
                        scene,
                        camera,
                        0.9,
                        0xffffff);
                    } else {
                      this.addTextMesh(
                        `${curLaneType}`,
                        endPosition,
                        scene,
                        camera,
                        0.9,
                        0xffffff);
                    }
                  }
                }
              }
              if (STORE.options.showTurnType && lane.turnType && lane.turnType.length) {
                const turnTypeList = [...new Set(lane.turnType.map(type => turnTypeMap[type]))];
                const turnTypeText = turnTypeList.join(',');
                this.addTextMesh(
                  `${turnTypeText}`,
                  endPosition,
                  scene,
                  camera,
                  1.0,
                  0xffffff);
              }
            }
          } else {
            pointSet.forEach((point) => {
              let pointPoints = [];
              if (point.points) {
                pointPoints = point.points.filter(item => {
                  if (!item.x || !item.y) {
                    return false;
                  }
                  if (STORE.options.showRangeView && item.distance && item.distance > STORE.meters.autoRange) {
                    return false;
                  }
                  return true;
                });
              }
              if (!pointPoints.length) {
                return;
              }
              if (!_.isEmpty(point) && !_.isEmpty(pointPoints)) {
                const points = coordinates.applyOffsetToArray(pointPoints);
                if (Array.isArray(point.lineType)) {
                  if (point.lineType.length >= pointPoints.length) {
                    const lineTypes = point.lineType.slice(0, pointPoints.length);
                    let currentType = lineTypes[0];
                    let currentPoints = [points[0]];
                    for (let i = 1; i < lineTypes.length; i++) {
                      if (lineTypes[i] === currentType) {
                        currentPoints.push(points[i]);
                        if (i === lineTypes.length - 1) {
                          const boundary = this.addLaneMesh(currentPoints, laneTypeColorMapping[laneType], currentType, boundaryWidth);
                          scene.add(boundary);
                          this.roadLines.push(boundary);
                        }
                      } else {
                        const boundary = this.addLaneMesh(currentPoints, laneTypeColorMapping[laneType], currentType, boundaryWidth);
                        scene.add(boundary);
                        this.roadLines.push(boundary);
                        currentType = lineTypes[i];
                        currentPoints = [points[i - 1], points[i]];
                      }
                    }
                  } else {
                    let startIndex = 0;
                    point.lineType.forEach((item, index) => {
                      startIndex = index * 5;
                      const boundary = this.addLaneMesh(points.slice(startIndex, startIndex + 6), laneTypeColorMapping[laneType], item, boundaryWidth);
                      scene.add(boundary);
                      this.roadLines.push(boundary);
                    });
                  }
                } else {
                  const cutoffFn = (cutoffPoints) => {
                    let realType = cutoffPoints[0].pointSpan;
                    let realPoints = [cutoffPoints[0]];
                    let laneColor =  laneTypeColorMapping[laneType];
                    for (let i = 1; i < cutoffPoints.length; i++) {
                      if (cutoffPoints[i].pointSpan === realType) {
                        realPoints.push(cutoffPoints[i]);
                        if (i === cutoffPoints.length - 1) {
                          if (realType === 'UNKNOWN' && laneType === 'leftBoundaryPointSet') {
                            laneColor = colorMapping.GREY;
                          }
                          if (realType === 'UNKNOWN' && laneType === 'rightBoundaryPointSet') {
                            laneColor = colorMapping.BLACK;
                          }
                          const boundary = this.addLaneMesh(coordinates.applyOffsetToArray(realPoints), laneColor, realType, boundaryWidth);
                          scene.add(boundary);
                          this.roadLines.push(boundary);
                        }
                      } else {
                        const boundary = this.addLaneMesh(coordinates.applyOffsetToArray(realPoints), laneColor, realType, boundaryWidth);
                        scene.add(boundary);
                        this.roadLines.push(boundary);
                        realType = cutoffPoints[i].pointSpan;
                        realPoints = [cutoffPoints[i - 1], cutoffPoints[i]];
                      }
                    }
                  };
                  if (point.lineType === undefined) {
                    if (lane.isCutoff && pointPoints[0].cutoff !== undefined && laneRelatedType !== 'naviLane') {
                      const pointsList = this.getPointsByCutoff(pointPoints);
                      pointsList.forEach((subPoints) => {
                        cutoffFn(subPoints);
                      });
                    } else {
                      cutoffFn(pointPoints);
                    }

                  } else {
                    const boundary = this.addLaneMesh(points, laneTypeColorMapping[laneType], point.lineType, boundaryWidth);
                    scene.add(boundary);
                    this.roadLines.push(boundary);
                  }
                }
              }
            });
          }
        }
      });
      const stoplinePosition = lane.stoplinePosition || [];
      if(!_.isEmpty(stoplinePosition)) {
        stoplinePosition.forEach(stopLine => {
          const points = coordinates.applyOffset(stopLine);
          const geometry = new THREE.BoxGeometry(1, 1, 0);
          const material = new THREE.MeshBasicMaterial({ color: 0xf40eb7 });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(points.x, points.y, 0);
          scene.add(cube);
          this.stopLineList.push(cube);
        });
      }
    });
  }

  addLaneMesh(points, color, lineType, lineWidth = 1.5) {
    switch (lineType) {
      case 'SOLID':
        return drawSegmentsFromPoints(
          points, color, lineWidth, this.zOffsetFactor, false,
        );
      case 'DOTTED':
        return drawDashedLineFromPoints(
          points, color, lineWidth, 0.5, 1, this.zOffsetFactor, 1, false,
        );
      case 'DASHED':
        return drawDashedLineFromPoints(
          points, color, lineWidth, 0.5, 1, this.zOffsetFactor, 1, false,
        );
      case 'UNKNOWN':
        return drawSegmentsFromPoints(
          points, color, lineWidth, this.zOffsetFactor, false, false, 0.4
        );
      case 'VIRTUAL':
        return drawDashedLineFromPoints(
          points, color, lineWidth, 0.5, 1, this.zOffsetFactor, 1, false,
        );
      default:
        return drawSegmentsFromPoints(
          points, color, 1.5, this.zOffsetFactor, false,
        );
    }
  }

  addCurbs(curbs, coordinates, scene) {
    if (_.isEmpty(curbs)) {
      return;
    }

    const rows = curbs.rows || [];
    if (_.isEmpty(rows)) {
      return;
    }

    rows.forEach((row) => {
      const values = row.values || [];
      if (!_.isEmpty(values)) {
        const points = coordinates.applyOffsetToArray(values);
        const boundary = this.addCurbsMesh(points);
        scene.add(boundary);
        this.roadCurbs.push(boundary);
      }
    });
  }

  addCurbsMesh(points) {
    return drawSegmentsFromPoints(
      points, colorMapping.CORAL, 0.2, this.zOffsetFactor, false,
    );
  }

  addTextMesh(text, position, scene, camera, size, color = 0xFFEA00) {
    const textMesh = new THREE.Object3D();
    const { charMesh, charWidth }  = this.textRender.drawChar3D(text, color, size);
    textMesh.position.set(position.x, position.y, position.z);
    textMesh.add(charMesh);
    textMesh.children.forEach((child) => {
      child.position.setX(child.position.x - charWidth / 2);
    });
    if (camera !== undefined && camera.quaternion !== undefined) {
      textMesh.quaternion.copy(camera.quaternion);
    }
    scene.add(textMesh);
    this.ids.push(textMesh);
  }

  getRoadMarkerIcon(type) {
    let img = null;
    switch (type) {
      case 'TURN_AROUND':
        img = uturn_icon;
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

  handleMarkers(lane, scene, markerIdx, coordinates) {
    if (lane && lane.directedConnectionTurnType) {
      const type = lane.directedConnectionTurnType;
      const centerPointSet = lane.centerPointSet || [];
      if (centerPointSet.length < 2) {
        return;
      }
      let icon = null;
      const startIndex = Math.max(centerPointSet.length - 4, 0);
      if (lane.isCutoff && centerPointSet[startIndex]?.cutoff) {
        return;
      }
      const start = coordinates.applyOffset(centerPointSet[startIndex]);
      const end = coordinates.applyOffset(centerPointSet[startIndex + 1]);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      if (markerIdx[type] >= this.cacheRoadMarkers[type].length) {
        icon = this.getRoadMarkerIcon(type);
        scene.add(icon);
        this.cacheRoadMarkers[type].push(icon);
      } else {
        icon = this.cacheRoadMarkers[type][markerIdx[type]];
      }
      if (icon) {
        icon.position.set(end.x, end.y, 0);
        icon.rotation.set(0, 0, -Math.PI / 2 + angle);
        icon.visible = true;
      }
      markerIdx[type]++;
    }
  }
}