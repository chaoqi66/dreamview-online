import _ from 'lodash';
import STORE from 'store';
import { drawThickBandFromPoints, drawDashedLineFromPoints, disposeMesh } from 'utils/draw';
import Text3D from 'renderer/text3d';
import * as THREE from 'three';

function normalizePlanningTrajectory(trajectory, coordinates) {
  if (!trajectory) {
    return [];
  }

  const result = [];

  for (let i = 0; i < trajectory.length; ++i) {
    const point = trajectory[i];
    const normalizedPoint = coordinates.applyOffset(point);

    if (normalizedPoint === null) {
      // Just skip the trajectory point if it cannot be
      // converted to the local coordinates.
      continue;
    }

    if (result.length > 0) {
      // Skip the point if the interval (against the previous point)
      // is too small. The interval is measured as L1 distance.
      const distance = Math.abs(result[result.length - 1].x - normalizedPoint.x)
                + Math.abs(result[result.length - 1].y - normalizedPoint.y);
      if (distance < PARAMETERS.planning.minInterval) {
        continue;
      }
    }

    result.push(normalizedPoint);
  }

  return result;
}

const randomColors = [0x616ee5 ,0xff77c4, 0x81b1ff, 0x7bffcf, 0xffaf6e, 0xd4ff6e];
export default class PlanningTrajectory {
  constructor() {
    this.paths = {};
    this.textRender = new Text3D();
    this.textList = [];
    this.meshs = [];
  }

  resetAll(scene) {
    this.textList.forEach((n) => {
      n.children.forEach((c) => {
        c.geometry.dispose();
        c.material.dispose();
      });
      scene.remove(n);
    });

    this.meshs.forEach((p) => {
      scene.remove(p);
      disposeMesh(p);
    });
    this.meshs = [];

    this.textList = [];
    this.textRender.reset();
  }

  update(world, planningData, coordinates, scene, camera) {
    this.resetAll(scene);
    const { meters } = STORE;

    // Derive the width of the trajectory ribbon.
    let width = null;
    if (!world.autoDrivingCar.width) {
      console.warn("Unable to get the auto driving car's width, "
                + 'planning line width has been set to default: '
                + `${PARAMETERS.planning.defaults.width} m.`);
      width = PARAMETERS.planning.defaults.width;
    } else {
      width = world.autoDrivingCar.width;
    }

    // Prepare data
    const newPaths = {};
    if (STORE.options.showPlanningPath && world.planningTrajectory) {
      newPaths.trajectory = world.planningTrajectory.map(
        (point) => ({ x: point.positionX, y: point.positionY }));
    }
    if (STORE.options.showPlanningPath && planningData && planningData.path) {
      planningData.path.forEach((path) => {
        newPaths[path.name] = path.pathPoint;
      });
    }

    // Draw paths
    const allPaths = _.union(Object.keys(this.paths), Object.keys(newPaths));
    let randomColorIndex = 0;
    allPaths.forEach((name) => {
      const optionName = name === 'trajectory' ? 'showPlanningTrajectory' : name;
      if (!STORE.options[optionName] && !STORE.options.customizedToggles.get(optionName)) {
        if (this.paths[name]) {
          this.paths[name].visible = false;
        }
      } else {
        const oldPath = this.paths[name];
        if (oldPath) {
          scene.remove(oldPath);
          oldPath.geometry.dispose();
          oldPath.material.dispose();
        }

        let property = PARAMETERS.planning.pathProperties[name];
        if (!property) {
          console.warn(
            `No path properties found for [${name}]. Use default properties instead.`,
          );
          property = PARAMETERS.planning.pathProperties.default;
          property.color = randomColors[randomColorIndex] || 0x616ee5;
          // PARAMETERS.planning.pathProperties[name] = property;
          randomColorIndex++;
        }

        if (name === 'trajectory') {
          if (meters.newDrivingMode === 'AUTO') {
            property.color = 0x00ffff;
          } else if (meters.newDrivingMode === 'MANUAL') {
            property.color = 0x8b0000;
          } else if (meters.newDrivingMode === 'STEER' || meters.newDrivingMode === 'SPEED') {
            property.color = 0xffff00;
          }
        }

        if (name === 'origin_reference_lane' || name === 'target_reference_lane') {
          const referenceLane = planningData.path.find(item => item.name === name);
          const inUse = referenceLane?.inUse;
          const fallback = referenceLane?.fallback;
          if (inUse) {
            property.color = 0x789fca;
          } else {
            property.color = 0x9d9b9b;
          }
          if (fallback) {
            property.color = 0xca833b;
          }
        }

        if (name === 'NN_PATH_REFERENCE') {
          property.color = 0x0000ff;
          property.width = 0.04;
          property.zOffset = 10;
        }

        if (newPaths[name]) {
          const points = normalizePlanningTrajectory(newPaths[name], coordinates);
          if (property.style === 'dash') {
            this.paths[name] = drawDashedLineFromPoints(points, property.color,
              width * property.width, 1 /* dash size */, 1 /* gapSize */,
              property.zOffset, property.opacity);
          } else {
            this.paths[name] = drawThickBandFromPoints(points, width * property.width,
              property.color, property.opacity, property.zOffset);
          }
          scene.add(this.paths[name]);
          if (name === 'trajectory') {
            const trajectoryLastPoint = points[points.length - 1];
            const planningEgoPath = STORE.meters.planningEgoPath;
            if (planningEgoPath && planningEgoPath.action) {
              const words = planningEgoPath.action.split('_');
              let actionText = '';
              actionText += words.map(word => word.charAt(0)).join('');
              const text = `${actionText}-${planningEgoPath.pathIndex}`;
              this.addTextMesh(text, camera, 0x00ffff, {x: trajectoryLastPoint.x, y: trajectoryLastPoint.y, z: 3}, 1.0, scene);
            }
          }
        }
      }
    });
    if (STORE.options.showPlanningPath && STORE.options.showPlanningEgoPath && world && world.planningPathPoint) {
      this.addPlanningPathPoint(world.planningPathPoint, width, coordinates, scene);
    }
  }

  addPlanningPathPoint(planningPathPoint, width = 1, coordinates, scene) {
    if (_.isEmpty(planningPathPoint)) {
      return;
    }
    const points = coordinates.applyOffsetToArray(planningPathPoint);
    const mesh = drawThickBandFromPoints(points, width * 1.35, 0x429b94, 0.6, 1.8);
    scene.add(mesh);
    this.meshs.push(mesh);
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
    this.textList.push(textMesh);
  }
}
