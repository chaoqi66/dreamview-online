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
import end_icon from 'assets/images/end.png';
import { drawImage } from 'utils/draw';
import { hideArrayObjects } from 'utils/misc';
import { turnTypeMap } from 'utils/constant';

import {
  drawSegmentsFromPoints,
  drawDashedLineFromPoints,
  drawCircle,
  disposeMesh,
} from 'utils/draw';

const colorMapping = {
  WHITE: 0xffffff,
  PINK: 0xff63c8,
  BLUE: 0x4829f4,
};

// 左蓝右粉中间白
const laneTypeColorMapping = {
  'centerPointSet': colorMapping.WHITE,
  'leftBoundaryPointSet': colorMapping.BLUE,
  'rightBoundaryPointSet': colorMapping.PINK
};
const laneTypeList = Object.keys(laneTypeColorMapping);

export default class PerceptionRoadStructure {
  constructor() {
    this.zOffsetFactor = 10;

    this.textRender = new Text3D();

    this.roadLines = [];

    this.intersectionList = [];

    this.ids = [];

    this.stopLineList = [];

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
    this.roadLines.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.roadLines = [];

    this.intersectionList.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.intersectionList = [];

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

    if (world.multiFrameLane && STORE.options.showRdPerMultiLane) {
      this.addMultiFrameLane(world.multiFrameLane, coordinates, scene);
    }
    this.handleEndIcons(scene, world, coordinates, camera);

    if (!STORE.options.showRoadStructurePerception) {
      return;
    }

    const predictionRoadStructure = world.predictionRoadStructure;
    if (_.isEmpty(predictionRoadStructure)) {
      return;
    }

    if (STORE.options.showRdStucPerceptionLane) {
      this.addLane(predictionRoadStructure.perceptionLaneSet, coordinates, scene, camera);
    }
    if (STORE.options.showRdStucPerceptionStopLine) {
      this.addStopLine(predictionRoadStructure.stoplineSet, coordinates, scene);
    }
    if (STORE.options.showRdStucPerceptionIntersection) {
      this.addIntersection(predictionRoadStructure.perceptionIntersectionArea, coordinates, scene);
    }
    if (STORE.options.showRdStucPerceptionCrosswalk) {
      this.addCrosswalkSet(predictionRoadStructure.perceptionCrosswalkArea, coordinates, scene);
    }
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

  handleMarkers(roadMarkerList, scene, markerIdx, coordinates) {
    if (_.isEmpty(roadMarkerList)) {
      return;
    }
    roadMarkerList.forEach(roadMarker => {
      const { beginPoint, endPoint, position, type } = roadMarker;
      const start = coordinates.applyOffset({ x: beginPoint.odomX, y: beginPoint.odomY });
      const end = coordinates.applyOffset({ x: endPoint.odomX, y: endPoint.odomY });
      const pos = coordinates.applyOffset({ x: position.odomX, y: position.odomY });
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      let icon = null;
      if (markerIdx[type] >= this.cacheRoadMarkers[type].length) {
        icon = this.getRoadMarkerIcon(type);
        scene.add(icon);
        this.cacheRoadMarkers[type].push(icon);
      } else {
        icon = this.cacheRoadMarkers[type][markerIdx[type]];
      }
      if (icon) {
        icon.position.set(pos.x, pos.y, 0);
        icon.rotation.set(0, 0, -Math.PI / 2 + angle);
        icon.visible = true;
      }
      markerIdx[type]++;
    });
  }

  handleEndIcons(scene, world, coordinates, camera) {
    const destination = STORE.planningStatus.destination;
    const autoDrivingCar = world.autoDrivingCar;
    const heading = autoDrivingCar.heading;
    if (this.endIcon) {
      if (camera instanceof THREE.OrthographicCamera && STORE.options.showBevRight) {
        this.endIcon.rotation.set(0, 0, heading);
      } else if (camera instanceof THREE.PerspectiveCamera) {
        this.endIcon.rotation.set(0, 0, heading - Math.PI / 2);
      } else {
        this.endIcon.rotation.set(0, 0, heading - Math.PI / 2);
      }
    }
    if (!this.endIcon && destination.x && destination.y) {
      const pos = coordinates.applyOffset({ x: destination.x, y: destination.y, z: destination.z || 0 });
      this.endIcon = drawImage(end_icon, 2, 2, 1, 1.6, 0, 2);
      this.endIcon.position.set(pos.x, pos.y, 2);
      this.endIcon.visible = true;
      this.endIcon.rotation.set(0, 0, heading);
      scene.add(this.endIcon);
    }
  }

  addCrosswalkSet(crosswalkSet, coordinates, scene) {
    if (_.isEmpty(crosswalkSet)) {
      return;
    }
    crosswalkSet.forEach(item => {
      if (item.areaCoordinate) {
        const points = coordinates.applyOffset(item.areaCoordinate);
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0);
        const material = new THREE.MeshBasicMaterial({ color: colorMapping.PURE_WHITE });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(points.x, points.y, 0);
        scene.add(cube);
        this.intersectionList.push(cube);
      }
    });
  }


  addIntersection(intersection, coordinates, scene) {
    if (_.isEmpty(intersection)) {
      return;
    }
    intersection.forEach(item => {
      if (item.areaCoordinate) {
        const points = coordinates.applyOffset(item.areaCoordinate);
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0);
        const material = new THREE.MeshBasicMaterial({ color: colorMapping.WHITE });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(points.x, points.y, 0);
        scene.add(cube);

        // const cube = this.getPredCircle();
        // cube.position.set(points.x, points.y, 1);
        // scene.add(cube);
        this.intersectionList.push(cube);
      }
    });
  }

  getPredCircle(color = 0xffffff) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: false,
      opacity: 0.5,
    });
    const circleMesh = drawCircle(0.2, material);
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

  addStopLine(stopLine, coordinates, scene) {
    if (_.isEmpty(stopLine)) {
      return;
    }
    stopLine.forEach(line => {
      const odomPoints = [
        { x: line?.start?.odomX, y: line?.start?.odomY },
        { x: line?.end?.odomX, y: line?.end?.odomY }
      ];
      const points = coordinates.applyOffsetToArray(odomPoints);
      const boundary = this.addLaneMesh(points, colorMapping.PURPLE);
      scene.add(boundary);
      this.stopLineList.push(boundary);
    });
  }

  handleCenterLaneText(pointSet, lane, coordinates, scene, camera) {
    const initPosition = coordinates.applyOffset(
      new THREE.Vector3(pointSet[Math.floor(pointSet.length / 2)].x,
        pointSet[Math.floor(pointSet.length / 2)].y + 0.5, 3),
    );
    const startPosition = coordinates.applyOffset(
      new THREE.Vector3(pointSet[0].x,
        pointSet[0].y + 0.5, 3),
    );
    const endPosition = coordinates.applyOffset(
      new THREE.Vector3(pointSet[pointSet.length - 1].x,
        pointSet[pointSet.length - 1].y + 0.5, 3),
    );
    if (STORE.options.showRdStucPerceptionLaneId) {
      this.drawTexts(
        `${lane.laneId}`,
        initPosition,
        scene,
        camera,
        0.9,
        colorMapping.YELLOW);
    }
    if (STORE.options.showSuccessorId) {
      if (lane.successorLaneIdSet && lane.successorLaneIdSet.length) {
        let text = '';
        lane.successorLaneIdSet.forEach((id, i) => {
          if (i === lane.successorLaneIdSet.length - 1) {
            text += `${lane.laneId}_${id}`;
          } else {
            text += `${lane.laneId}_${id},`;
          }
        });
        this.addTextMesh(text, camera, 0xffffff, startPosition, 0.9, scene);
      }
      if (lane.predecessorLaneIdSet && lane.predecessorLaneIdSet.length) {
        let text = '';
        lane.predecessorLaneIdSet.forEach((id, i) => {
          if (i === lane.predecessorLaneIdSet.length - 1) {
            text += `${id}_${lane.laneId}`;
          } else {
            text += `${id}_${lane.laneId},`;
          }
        });
        this.addTextMesh(text, camera, 0xffffff, startPosition, 0.9, scene);
      }
    }
    if (STORE.options.showTurnType && lane.turnType && lane.turnType.length) {
      const turnTypeList = [...new Set(lane.turnType.map(type => turnTypeMap[type]))];
      const turnTypeText = turnTypeList.join(',');
      this.addTextMesh(
        `${turnTypeText}`,
        camera,
        0xffffff,
        endPosition,
        0.9,
        scene);
    }
  }

  addMultiFrameLane(multiFrameLane, coordinates, scene) {
    if (multiFrameLane.followingLanes) {
      const multiFrameLaneNum = STORE.meters.multiFrameLane;
      const followLane = multiFrameLane?.followingLanes?.perceptionLane || [];
      const preLane = multiFrameLane?.previousLanes?.perceptionLane || [];
      const allLanes = [...preLane, ...followLane];
      for (let i = 0; i < allLanes.length; i++) {
        if (i > multiFrameLaneNum.end || i < multiFrameLaneNum.start) {
          continue;
        }
        const item = allLanes[i];
        const points = coordinates.applyOffsetToArray(item.centerPointSet || []);
        const boundary = this.addLaneMesh(points, 0xffff00, 'SOLID' ,1);
        scene.add(boundary);
        this.roadLines.push(boundary);
      }
    }
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

  addLane(laneSet, coordinates, scene, camera) {
    if (_.isEmpty(laneSet)) {
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
    laneSet.forEach((lane) => {
      if (STORE.options.showPdLane && lane.pdLane === false) {
        return;
      }
      laneTypeList.forEach((laneType) => {
        let pointSet = lane[laneType] || [];

        if (!_.isEmpty(pointSet)) {
          if (laneType === 'centerPointSet') {
            if (pointSet) {
              pointSet = pointSet.filter(item => item.x && item.y);
            }
            const points = coordinates.applyOffsetToArray(pointSet);
            const boundary = this.addLaneMesh(points, laneTypeColorMapping[laneType], 'SOLID', 1);
            scene.add(boundary);
            this.roadLines.push(boundary);
            this.handleCenterLaneText(pointSet, lane, coordinates, scene, camera);
            this.handleMarkers(lane.roadMarker, scene, markerIdx, coordinates);
          } else {
            // console.log('laneType = ', laneType);
            // console.log('pointSet = ', pointSet);
            pointSet.forEach((point) => {
              let pointPoints = [];
              if (point.points) {
                pointPoints = point.points.filter(item => item.x && item.y);
              }
              if (!_.isEmpty(point) && !_.isEmpty(pointPoints)) {
                const points = coordinates.applyOffsetToArray(pointPoints);
                if (Array.isArray(point.lineType)) {
                  let startIndex = 0;
                  point.lineType.forEach((item, index) => {
                    startIndex = index * 5;
                    const boundary = this.addLaneMesh(points.slice(startIndex, startIndex + 6), laneTypeColorMapping[laneType], item);
                    scene.add(boundary);
                    this.roadLines.push(boundary);
                  });
                } else {
                  if (pointPoints[0].pointSpan !== undefined) {
                    const cutoffFn = (cutoffPoints) => {
                      let realType = cutoffPoints[0].pointSpan;
                      let realPoints = [cutoffPoints[0]];
                      for (let i = 1; i < cutoffPoints.length; i++) {
                        if (cutoffPoints[i].pointSpan === realType) {
                          realPoints.push(cutoffPoints[i]);
                          if (i === cutoffPoints.length - 1) {
                            const boundary = this.addLaneMesh(coordinates.applyOffsetToArray(realPoints), laneTypeColorMapping[laneType], realType);
                            scene.add(boundary);
                            this.roadLines.push(boundary);
                          }
                        } else {
                          const boundary = this.addLaneMesh(coordinates.applyOffsetToArray(realPoints), laneTypeColorMapping[laneType], realType);
                          scene.add(boundary);
                          this.roadLines.push(boundary);
                          realType = cutoffPoints[i].pointSpan;
                          realPoints = [cutoffPoints[i - 1], cutoffPoints[i]];
                        }
                      }
                    };
                    cutoffFn(pointPoints);
                  } else {
                    const boundary = this.addLaneMesh(points, laneTypeColorMapping[laneType], point.lineType);
                    scene.add(boundary);
                    this.roadLines.push(boundary);
                  }
                }
              }
            });
          }
        }
      });
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
          points, color, drawDashedLineFromPoints, 0.5, 1, this.zOffsetFactor, 1.5, false,
        );
      default:
        return drawSegmentsFromPoints(
          points, color, lineWidth, this.zOffsetFactor, false,
        );
    }
  }
}