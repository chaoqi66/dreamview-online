import * as THREE from 'three';
import Stats from 'stats.js';

import STORE from 'store';

import Styles from 'styles/main.scss';

import Coordinates from 'renderer/coordinates';
import AutoDrivingCar from 'renderer/adc';
import CheckPoints from 'renderer/check_points.js';
import Ground from 'renderer/ground';
import TileGround from 'renderer/tileground';
import Map from 'renderer/map';
import RoadStructure from 'renderer/roadStructure';
import RoadStructureNet from 'renderer/roadStructureNet';
import PerceptionRoadStructure from 'renderer/perceptionRoadStructure';
import RaviTwoKm from 'renderer/naviTwoKm';
import LaneMap from 'renderer/laneMap';
import PncNn from 'renderer/pncNn';
import PerceptioCurb from 'renderer/perceptioCurb';
import TopoTree from 'renderer/topoTree';
import PlanningTrajectory from 'renderer/trajectory.js';
import PlanningStatus from 'renderer/status.js';
import PlanningMultiPolicy from 'renderer/multi_policy';
import PerceptionObstacles from 'renderer/obstacles.js';
import PerceptionObstaclesNew from 'renderer/obstaclesNew';
import Decision from 'renderer/decision.js';
import Prediction from 'renderer/prediction.js';
import Routing from 'renderer/routing.js';
import RoutingEditor from 'renderer/routing_editor.js';
import Gnss from 'renderer/gnss.js';
import PointCloud from 'renderer/point_cloud.js';
import Distance from 'renderer/distance.js';
import CarHistoryLocal from 'renderer/carHistoryLocal.js';
import BehaviorMap from 'renderer/behaviorMap';

import UTTERANCE from 'store/utterance';
import ObstaclesPncPre from 'renderer/obstaclesPncPre';
import { roundNumber } from 'utils/misc';


const _ = require('lodash');
let initViewFactor = 19;

class Renderer {
  constructor() {
    // Disable antialias for mobile devices.
    const useAntialias = !this.isMobileDevice();

    this.coordinates = new Coordinates();
    this.coordinates2 = new Coordinates();
    this.coordinatesPncNn = new Coordinates();
    this.coordinatesPncPre = new Coordinates();
    this.renderer = new THREE.WebGLRenderer({
      antialias: useAntialias,
      // Transparent background
      alpha: true,
    });
    this.rendererLanemap = new THREE.WebGLRenderer({
      antialias: useAntialias,
    });
    this.sceneLanemap = new THREE.Scene();
    this.rendererPncPre = new THREE.WebGLRenderer({
      antialias: useAntialias,
    });
    this.scenePncPre = new THREE.Scene();
    this.rendererPncNn = new THREE.WebGLRenderer({
      antialias: useAntialias,
    });
    this.scenePncNn = new THREE.Scene();
    this.scene = new THREE.Scene();
    if (OFFLINE_PLAYBACK) {
      this.scene.background = new THREE.Color(0x000C17);
    }

    // The dimension of the scene
    this.dimension = {
      width: 0,
      height: 0,
    };

    // The ground.
    this.ground = (PARAMETERS.ground.type === 'tile' || OFFLINE_PLAYBACK)
      ? new TileGround(this.renderer) : new Ground();

    // The map.
    this.map = new Map();

    // The roadStructure
    this.roadStructure = new RoadStructure();
    this.roadStructurePncPre = new RoadStructure();
    this.roadStructureNet = new RoadStructureNet();
    this.perceptionRoadStructure = new PerceptionRoadStructure();
    this.naviTwoKm = new RaviTwoKm();
    this.distance = new Distance();

    this.LaneMap = new LaneMap();
    this.PncNn = new PncNn();
    this.PerceptioCurb = new PerceptioCurb();
    this.TopoTree = new TopoTree();
    this.BehaviorMap = new BehaviorMap();
    this.carHistoryLocal = new CarHistoryLocal();

    this.adcLanemap = new AutoDrivingCar('adc', this.sceneLanemap);
    this.adcPncNn = new AutoDrivingCar('adc', this.scenePncNn);
    this.adcPncPre = new AutoDrivingCar('adc', this.scenePncPre);

    // The car in virtual close loop
    this.closeLoopAdc = new AutoDrivingCar('closeLoopAdc', this.scene);

    // The car that projects the starting point of the planning trajectory
    this.planningAdc = OFFLINE_PLAYBACK ? null : new AutoDrivingCar('planningAdc', this.scene);

    // The shadow localization
    this.shadowAdc = new AutoDrivingCar('shadowAdc', this.scene);

    // The main autonomous driving car.
    this.adc = new AutoDrivingCar('adc', this.scene);

    // The planning trajectory.
    this.planningTrajectory = new PlanningTrajectory();

    // The planning status
    this.planningStatus = new PlanningStatus();

    // THe planning multi_policy
    this.planningMultiPolicy = new PlanningMultiPolicy();

    // The perception obstacles.
    this.perceptionObstacles = new PerceptionObstacles();

    // The new perception obstacles.
    this.perceptionObstaclesNew = new PerceptionObstaclesNew();

    this.perceptionObstaclesNew2 = new PerceptionObstaclesNew();

    this.pncPreObstacles = new ObstaclesPncPre();

    // The decision.
    this.decision = new Decision();

    // The prediction.
    this.prediction = new Prediction();

    // The routing.
    this.routing = new Routing();

    // The route editor
    this.routingEditor = new RoutingEditor();
    this.routingPoint = null;

    // Distinguish between drawing point and drawing arrow
    this.startMove = false;

    // The GNSS/GPS
    this.gnss = new Gnss();

    this.pointCloud = new PointCloud();

    this.checkPoints = OFFLINE_PLAYBACK && new CheckPoints(this.coordinates, this.scene);

    // The Performance Monitor
    this.stats = null;
    if (PARAMETERS.debug.performanceMonitor && window.location.host === 'dreamview-test.robosense.cn') {
      this.stats = new Stats();
      this.stats.showPanel(1);
      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.top = null;
      this.stats.domElement.style.bottom = '0px';
      document.body.appendChild(this.stats.domElement);
    }

    // Geolocation of the mouse
    this.geolocation = { x: 0, y: 0 };

    this.initPerspective = false;
    this.initOrthographic = false;

    this.initGeo = false;

    this.geo1 = null;
    this.geo2 = null;
    this.cameraLanemapZoom = 1.2;
    this.cameraPncNnZoom = 1.2;
    this.cameraPncPreZoom = 1.2;
    this.pncPreWorld = {};
  }

  initializePerspectiveCamera() {
    this.camera = new THREE.PerspectiveCamera(
      PARAMETERS.camera[this.options.cameraAngle].fov,
      this.width / this.height,
      PARAMETERS.camera[this.options.cameraAngle].near,
      PARAMETERS.camera[this.options.cameraAngle].far,
    );
    this.camera.name = 'camera';
    this.scene.add(this.camera);

    this.updateDimension(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera.up.set(0, 0, 1);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.enable = false;

    this.initPerspective = true;
    this.initOrthographic = false;
    this.followCarFlag = false;
  }

  initializeOrthographicCamera() {
    if (this.width <= 1200) {
      initViewFactor = 10;
    }
    this.camera = new THREE.OrthographicCamera(
      this.width / (-1 * initViewFactor),
      this.width / initViewFactor,
      this.height / initViewFactor,
      this.height / (-1 * initViewFactor),
      1,
      4000,
    );
    this.camera.name = 'camera';
    this.scene.add(this.camera);

    this.updateDimension(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // this.camera.up.set(0, 0, 1);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.enable = false;

    this.initPerspective = false;
    this.initOrthographic = true;
  }

  initializeLanemapCamera() {
    if (this.width <= 1200) {
      initViewFactor = 10;
    }
    this.cameraLanemap = new THREE.OrthographicCamera(
      this.width / (-1 * initViewFactor),
      this.width / initViewFactor,
      this.height / initViewFactor,
      this.height / (-1 * initViewFactor),
      1,
      4000,
    );
    this.cameraLanemap.name = 'cameraLanemap';
    let heading = this.world?.autoDrivingCar?.heading || 0;
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }
    this.cameraLanemap.up.set(Math.cos(heading), Math.sin(heading), 0);
    this.cameraLanemap.zoom = this.cameraLanemapZoom;
    this.cameraLanemap.fov = 60;
    this.cameraLanemap.updateProjectionMatrix();
    this.sceneLanemap.add(this.cameraLanemap);
    this.rendererLanemap.setPixelRatio(window.devicePixelRatio);
  }

  scaleLanemap(scale) {
    if (scale > 0) {
      if (this.cameraLanemapZoom <= 0.4) {
        this.cameraLanemapZoom = 0.4;
        return;
      }
      this.cameraLanemapZoom -= 0.1;
    } else {
      this.cameraLanemapZoom += 0.1;
    }
    this.cameraLanemap.zoom = this.cameraLanemapZoom;
    this.cameraLanemap.updateProjectionMatrix();
  }

  lanemapInitialize(canvasId, width, height) {
    const container = document.getElementById(canvasId);
    container.appendChild(this.rendererLanemap.domElement);
    const ambient = new THREE.AmbientLight(0x444444);
    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1).normalize();
    this.sceneLanemap.add(ambient);
    this.sceneLanemap.add(directionalLight);
    this.rendererLanemap.setSize(width, height);
    this.lanmapLoad = true;
    this.initializeLanemapCamera();
  }

  pncPreInitialize(canvasId, width, height) {
    const container = document.getElementById(canvasId);
    container.appendChild(this.rendererPncPre.domElement);
    const ambient = new THREE.AmbientLight(0x444444);
    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1).normalize();
    this.scenePncPre.add(ambient);
    this.scenePncPre.add(directionalLight);
    this.rendererPncPre.setSize(width, height);
    this.pncPreLoad = true;
    this.initializePncPreCamera();
  }

  initializePncPreCamera() {
    if (this.width <= 1200) {
      initViewFactor = 10;
    }
    this.cameraPncPre = new THREE.OrthographicCamera(
      this.width / (-1 * initViewFactor),
      this.width / initViewFactor,
      this.height / initViewFactor,
      this.height / (-1 * initViewFactor),
      1,
      4000,
    );
    this.cameraPncPre.name = 'cameraPncPre';
    let heading = this.world?.autoDrivingCar?.heading || 0;
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }
    this.cameraPncPre.up.set(Math.cos(heading), Math.sin(heading), 0);
    this.cameraPncPre.zoom = this.cameraPncPreZoom;
    this.cameraPncPre.fov = 60;
    this.cameraPncPre.updateProjectionMatrix();
    this.scenePncPre.add(this.cameraPncPre);
    this.rendererPncPre.setPixelRatio(window.devicePixelRatio);
  }

  enableOrbitPncPre() {
    let heading = this.pncPreWorld?.autoDrivingCar?.heading || 0;
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }
    this.cameraPncPre.up.set(Math.cos(heading), Math.sin(heading), 0);
    const carPosition = this.adcPncPre.mesh.position;
    this.cameraPncPre.position.set(carPosition.x, carPosition.y, 50);
    const lookAtPosition = new THREE.Vector3(carPosition.x, carPosition.y, 0);
    this.cameraPncPre.lookAt(lookAtPosition);
  }

  scalePncPre(scale) {
    if (scale > 0) {
      if (this.cameraPncPreZoom <= 0.4) {
        this.cameraPncPreZoom = 0.4;
        return;
      }
      this.cameraPncPreZoom -= 0.1;
    } else {
      this.cameraPncPreZoom += 0.1;
    }
    this.cameraPncPre.zoom = this.cameraPncPreZoom;
    this.cameraPncPre.updateProjectionMatrix();
  }

  pncNnInitialize(canvasId, width, height) {
    const container = document.getElementById(canvasId);
    container.appendChild(this.rendererPncNn.domElement);
    const ambient = new THREE.AmbientLight(0x444444);
    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1).normalize();
    this.scenePncNn.add(ambient);
    this.scenePncNn.add(directionalLight);
    this.rendererPncNn.setSize(width, height);
    this.pncNnLoad = true;
    this.initializePncNnCamera();
  }

  initializePncNnCamera() {
    if (this.width <= 1200) {
      initViewFactor = 10;
    }
    this.cameraPncNn = new THREE.OrthographicCamera(
      this.width / (-1 * initViewFactor),
      this.width / initViewFactor,
      this.height / initViewFactor,
      this.height / (-1 * initViewFactor),
      1,
      4000,
    );
    this.cameraPncNn.name = 'cameraPncNn';
    let heading = this.world?.autoDrivingCar?.heading || 0;
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }
    this.cameraPncNn.up.set(Math.cos(heading), Math.sin(heading), 0);
    this.cameraPncNn.zoom = this.cameraLanemapZoom;
    this.cameraPncNn.fov = 60;
    this.cameraPncNn.updateProjectionMatrix();
    this.scenePncNn.add(this.cameraPncNn);
    this.rendererPncNn.setPixelRatio(window.devicePixelRatio);
  }

  enableOrbitPncNn() {
    let heading = this.world.autoDrivingCar.heading;
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }
    this.cameraPncNn.up.set(Math.cos(heading), Math.sin(heading), 0);
    const carPosition = this.adcLanemap.mesh.position;
    this.cameraPncNn.position.set(carPosition.x, carPosition.y, 50);
    const lookAtPosition = new THREE.Vector3(carPosition.x, carPosition.y, 0);
    this.cameraPncNn.lookAt(lookAtPosition);
  }

  scalePncNn(scale) {
    if (scale > 0) {
      if (this.cameraPncNnZoom <= 0.4) {
        this.cameraPncNnZoom = 0.4;
        return;
      }
      this.cameraPncNnZoom -= 0.1;
    } else {
      this.cameraPncNnZoom += 0.1;
    }
    this.cameraPncNn.zoom = this.cameraPncNnZoom;
    this.cameraPncNn.updateProjectionMatrix();
  }

  enableOrbitLanemap() {
    let heading = this.world.autoDrivingCar.heading;
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }
    this.cameraLanemap.up.set(Math.cos(heading), Math.sin(heading), 0);
    const carPosition = this.adcLanemap.mesh.position;
    this.cameraLanemap.position.set(carPosition.x, carPosition.y, 50);
    const lookAtPosition = new THREE.Vector3(carPosition.x, carPosition.y, 0);
    this.cameraLanemap.lookAt(lookAtPosition);
  }

  initialize(canvasId, width, height, options, cameraData) {
    this.options = options;
    this.cameraData = cameraData;
    this.canvasId = canvasId;

    this.width = width;
    this.height = height;

    // Camera
    this.viewAngle = PARAMETERS.camera.viewAngle;
    this.viewDistance = (
      PARAMETERS.camera.laneWidth
            * PARAMETERS.camera.laneWidthToViewDistanceRatio);

    // this.initializePerspectiveCamera();
    // this.initializeOrthographicCamera();

    // this.camera.name = 'camera';
    // this.scene.add(this.camera);

    // this.updateDimension(width, height);
    if (width && height) {
      this.renderer.setSize(width, height);
      this.dimension.width = width;
      this.dimension.height = height;
    }
    // this.renderer.setPixelRatio(window.devicePixelRatio);

    const container = document.getElementById(canvasId);
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0x444444);
    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1).normalize();

    // The orbit axis of the OrbitControl depends on camera's up vector
    // and can only be set during creation of the controls. Thus,
    // setting camera up here. Note: it's okay if the camera.up doesn't
    // match the point of view setting, the value will be adjusted during
    // each update cycle.
    // this.camera.up.set(0, 0, 1);

    // Orbit control for moving map
    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.enable = false;

    // handler for route editing with mouse down events
    this.onMouseDownHandler = this.editRoute.bind(this);
    this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);
    this.onMouseUpHandler = this.onMouseUpHandler.bind(this);

    this.onMouseDownTest = this.downTest.bind(this);

    this.scene.add(ambient);
    this.scene.add(directionalLight);

    // TODO maybe add sanity check.

    // Actually start the animation.
    this.animate();
  }

  maybeInitializeOffest(x, y, forced_update = false) {
    if (!this.coordinates.isInitialized() || forced_update) {
      this.coordinates.initialize(x, y);
      this.coordinates2.initialize(x, y);
      this.coordinatesPncNn.initialize(x, y);
      this.coordinatesPncPre.initialize(x, y);
    }
  }

  updateDimension(width, height) {
    if (width < Styles.MIN_MAIN_VIEW_WIDTH / 2 && this.dimension.width >= width) {
      // Reach minimum, do not update camera/renderer dimension anymore.
      return;
    }

    if (STORE.options.cameraAngle !== 'Orthographic') {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } else if (this.initOrthographic) {
      const scalingFactor = height / this.dimension.height;

      if (width <= 1200) {
        initViewFactor = 8;
      }
      this.camera.left = width / scalingFactor / (-1 * initViewFactor);
      this.camera.right = width / scalingFactor / initViewFactor;
      this.camera.top = height / scalingFactor / initViewFactor;
      this.camera.bottom = height / scalingFactor / (-1 * initViewFactor);
      if (STORE.options.showLaneMap && this.cameraLanemap) {
        this.rendererLanemap.setSize(width * 0.3, height * 0.3);
        this.cameraLanemap.left = width / scalingFactor / (-1 * initViewFactor);
        this.cameraLanemap.right = width / scalingFactor / initViewFactor;
        this.cameraLanemap.top = height / scalingFactor / initViewFactor;
        this.cameraLanemap.bottom = height / scalingFactor / (-1 * initViewFactor);
        this.cameraLanemap.updateProjectionMatrix();
      }
      if (STORE.options.showPncNnCanvas && this.cameraPncNn) {
        this.rendererPncNn.setSize(width * 0.35, height * 0.35);
        this.cameraPncNn.left = width / scalingFactor / (-1 * initViewFactor);
        this.cameraPncNn.right = width / scalingFactor / initViewFactor;
        this.cameraPncNn.top = height / scalingFactor / initViewFactor;
        this.cameraPncNn.bottom = height / scalingFactor / (-1 * initViewFactor);
        this.cameraPncNn.updateProjectionMatrix();
      }
    }

    this.renderer.setSize(width, height);

    this.dimension.width = width;
    this.dimension.height = height;
  }

  enableOrbitControls(enableRotate) {
    // update camera
    const carPosition = this.adc.mesh.position;
    this.camera.position.set(carPosition.x, carPosition.y, 50);
    // if (this.coordinates.systemName === 'FLU') {
    //   this.camera.up.set(1, 0, 0);
    // } else {
    //   this.camera.up.set(0, 0, 1);
    // }
    const lookAtPosition = new THREE.Vector3(carPosition.x, carPosition.y, 0);
    this.camera.lookAt(lookAtPosition);

    // update control reset values to match current camera's
    this.controls.target0 = lookAtPosition.clone();
    this.controls.position0 = this.camera.position.clone();
    this.controls.zoom0 = this.camera.zoom;

    // set distance control
    this.controls.minDistance = 4;
    this.controls.maxDistance = 4000;

    // set vertical angle control
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2;

    this.controls.enabled = true;
    this.controls.enableRotate = enableRotate;
    this.controls.reset();
  }

  adjustCamera(target, pov) {
    if (this.routingEditor.isInEditingMode()) {
      return;
    }

    if (pov !== 'Orthographic' && !this.initPerspective) {
      this.initializePerspectiveCamera();
      this.camera.fov = PARAMETERS.camera[pov].fov;
      this.camera.near = PARAMETERS.camera[pov].near;
      this.camera.far = PARAMETERS.camera[pov].far;
    }

    let heading = this.world.autoDrivingCar.heading;
    if (STORE.options.showVirtualCloseLoop || STORE.options.showCloseLoop) {
      this.world.virtualCar && (heading = this.world.virtualCar.heading);
    }
    if (STORE.options.showBevRight) {
      heading += (Math.PI / 2);
    }

    switch (pov) {
      case 'Default':
        let deltaX = (this.viewDistance * Math.cos(target.rotation.y)
                * Math.cos(this.viewAngle));
        let deltaY = (this.viewDistance * Math.sin(target.rotation.y)
                * Math.cos(this.viewAngle));
        let deltaZ = this.viewDistance * Math.sin(this.viewAngle);

        this.camera.position.x = target.position.x - deltaX;
        this.camera.position.y = target.position.y - deltaY;
        this.camera.position.z = target.position.z + deltaZ;
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt({
          x: target.position.x + deltaX,
          y: target.position.y + deltaY,
          z: 0,
        });

        this.controls.enabled = false;
        break;
      case 'Near':
        deltaX = (this.viewDistance * 0.5 * Math.cos(target.rotation.y)
                    * Math.cos(this.viewAngle));
        deltaY = (this.viewDistance * 0.5 * Math.sin(target.rotation.y)
                    * Math.cos(this.viewAngle));
        deltaZ = this.viewDistance * 0.5 * Math.sin(this.viewAngle);

        this.camera.position.x = target.position.x - deltaX;
        this.camera.position.y = target.position.y - deltaY;
        this.camera.position.z = target.position.z + deltaZ;
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt({
          x: target.position.x + deltaX,
          y: target.position.y + deltaY,
          z: 0,
        });

        this.controls.enabled = false;
        break;
      case 'Overhead':
        deltaX = (this.viewDistance * 0.5 * Math.cos(target.rotation.y)
                * Math.cos(this.viewAngle));
        deltaY = (this.viewDistance * 0.5 * Math.sin(target.rotation.y)
                * Math.cos(this.viewAngle));

        this.camera.position.x = target.position.x + deltaX;
        this.camera.position.y = target.position.y + deltaY;
        // if (this.coordinates.systemName === 'FLU') {
        //   this.camera.up.set(1, 0, 0);
        // } else {
        //   this.camera.up.set(0, 1, 0);
        // }
        this.camera.up.set(Math.cos(heading), Math.sin(heading), 0);
        // this.camera.up.set(0, 0, 1);
        this.camera.lookAt({
          x: target.position.x + deltaX,
          y: target.position.y + deltaY,
          z: 0,
        });

        if (!this.controls.enabled) {
          this.enableOrbitControls(true);
        }
        this.controls.enableRotate = false;
        break;
      case 'Map':
        if (!this.controls.enabled) {
          this.enableOrbitControls(true);
        }
        this.controls.enableRotate = true;
        break;
      case 'CameraView': {
        const { position, rotation } = this.cameraData.get();

        const { x, y, z } = this.coordinates.applyOffset(position);
        this.camera.position.set(x, y, z);

        // Threejs camera is default facing towards to Z-axis negative direction,
        // but the actual camera is looking at Z-axis positive direction. So we need
        // to adjust the camera rotation considering the default camera orientation.
        this.camera.rotation.set(rotation.x + Math.PI, -rotation.y, -rotation.z);

        this.controls.enabled = false;

        const image = document.getElementById('camera-image');
        if (image && this.cameraData.imageSrcData) {
          image.src = this.cameraData.imageSrcData;
        }

        break;
      }
      case 'Orthographic': {
        if (!this.initOrthographic) {
          this.initializeOrthographicCamera();
        }

        this.camera.up.set(Math.cos(heading), Math.sin(heading), 0);

        deltaX = (this.viewDistance * 1.5 / this.camera.zoom * Math.cos(target.rotation.y)
                * Math.cos(this.viewAngle));
        deltaY = (this.viewDistance * 1.5 / this.camera.zoom * Math.sin(target.rotation.y)
                    * Math.cos(this.viewAngle));

        if (STORE.options.showFollowCar) {
          this.camera.position.x = target.position.x + deltaX;
          this.camera.position.y = target.position.y + deltaY;
          this.camera.lookAt({
            x: target.position.x + deltaX,
            y: target.position.y + deltaY,
            z: 0,
          });
          // this.controls.enabled = false;
          this.followCarFlag = true;
        } else {
          if (this.followCarFlag) {
            this.enableOrbitControls(true);
            this.followCarFlag = false;
          }
          // if (STORE.geolocation.x && STORE.geolocation.y) {
          //   this.bindTest();

          //   let offsetX = 0;
          //   let offsetY = 0;
          //   if (!this.initGeo && this.geo1 && this.geo2) {
          //     const mouseX = this.geo1.x - this.geo2.x;
          //     const mouseY = this.geo1.y - this.geo2.y;

          //     offsetX = mouseX * 100;
          //     offsetY = mouseY * 100;
          //     console.log('offsetX = ', offsetX);
          //     console.log('offsetY = ', offsetY);

          //     deltaX += offsetX;
          //     deltaY += offsetY;
          //   }

          //   this.camera.position.x = target.position.x + deltaX;
          //   this.camera.position.y = target.position.y + deltaY;
          //   this.camera.lookAt({
          //     x: target.position.x + deltaX,
          //     y: target.position.y + deltaY,
          //     z: 0,
          //   });
          // }
        }

        if (!this.controls.enabled) {
          this.enableOrbitControls(true);
        }
        this.controls.enableRotate = false;
        break;
      }
    }

    this.camera.updateProjectionMatrix();
  }

  bindTest() {
    document.getElementById(this.canvasId).addEventListener('mousedown',
      this.onMouseDownTest,
      false);
  }

  downTest(event) {
    if (event.target && !_.isEqual('CANVAS', event.target.tagName)) {
      return;
    }
    if (event.button !== THREE.MOUSE.LEFT) {
      return;
    }

    // return if the ground or coordinates is not loaded yet
    if (!this.coordinates.isInitialized() || !this.ground.mesh) {
      return;
    }

    if (!this.initGeo) {
      this.geo1 = this.getGeoTest(event);
    } else {
      this.geo2 = this.getGeoTest(event);

      console.log('this.geo1 = ', this.geo1);
      console.log('this.geo2 = ', this.geo2);
    }
    this.initGeo = !this.initGeo;
  }

  getGeoTest(event) {
    const canvasPosition = event.currentTarget.getBoundingClientRect();
    const vector = new THREE.Vector3(
      ((event.clientX - canvasPosition.left) / this.dimension.width) * 2 - 1,
      -((event.clientY - canvasPosition.top) / this.dimension.height) * 2 + 1,
      0,
    );

    // vector.unproject(this.camera);

    // const direction = vector.sub(this.camera.position).normalize();
    // const distance = -this.camera.position.z / direction.z;
    // const pos = this.camera.position.clone().add(direction.multiplyScalar(distance));

    // console.log('direction = ', direction);
    // console.log('distance = ', distance);
    // console.log('pos = ', pos);

    return vector;
  }

  enableRouteEditing() {
    this.enableOrbitControls(false);
    this.routingEditor.enableEditingMode(this.camera, this.adc);

    document.getElementById(this.canvasId).addEventListener('mousedown',
      this.onMouseDownHandler,
      false);
    document.getElementById(this.canvasId).addEventListener('mouseup',
      this.onMouseUpHandler,
      false);
    document.getElementById(this.canvasId).addEventListener('mousemove',
      this.onMouseMoveHandler,
      false);
  }

  disableRouteEditing() {
    this.routingEditor.disableEditingMode(this.scene);

    const element = document.getElementById(this.canvasId);
    if (element) {
      element.removeEventListener('mousedown',
        this.onMouseDownHandler,
        false);
      element.removeEventListener('mouseup',
        this.onMouseUpHandler,
        false);
      element.removeEventListener('mousemove',
        this.onMouseMoveHandler,
        false);
      this.startMove = false;
      this.routingPoint = null;
    }
  }

  addDefaultEndPoint(points) {
    for (let i = 0; i < points.length; i++) {
      this.routingEditor.addRoutingPoint(points[i], this.coordinates, this.scene, true);
    }
  }

  addDefaultRouting(routingName) {
    return this.routingEditor.addDefaultRouting(routingName, this.coordinates);
  }

  removeInvalidRoutingPoint(pointId, error) {
    const index = this.routingEditor.removeInvalidRoutingPoint(pointId, error, this.scene);
    if (index !== -1) {
      this.map.changeSelectedParkingSpaceColor(index, 0xDAA520);
    }
  }

  setParkingInfo(info) {
    this.routingEditor.setParkingInfo(info);
  }

  removeAllRoutingPoints() {
    const indexArr = this.routingEditor.removeAllRoutePoints(this.scene);
    if (!_.isEmpty(indexArr)) {
      indexArr.forEach(item => {
        this.map.changeSelectedParkingSpaceColor(item, 0xDAA520);
      });
    }
  }

  removeLastRoutingPoint() {
    const index = this.routingEditor.removeLastRoutingPoint(this.scene);
    if (index !== -1) {
      this.map.changeSelectedParkingSpaceColor(index, 0xDAA520);
    }
  }

  sendRoutingRequest(points = []) {
    return this.routingEditor.sendRoutingRequest(this.adc.mesh.position,
      this.adc.mesh.rotation.y,
      this.coordinates, points);
  }

  sendCycleRoutingRequest(defaultRoutingName, points, cycleNumber) {
    return this.routingEditor.sendCycleRoutingRequest(
      defaultRoutingName,
      points,
      cycleNumber,
      this.adc.mesh.position,
      this.adc.mesh.rotation.y,
      this.coordinates);
  }

  editRoute(event) {
    // Distinguish between operating on the screen and
    // selecting points on the screen
    if (event.target && !_.isEqual('CANVAS', event.target.tagName)) {
      return;
    }
    if (!this.routingEditor.isInEditingMode() || event.button !== THREE.MOUSE.LEFT) {
      return;
    }

    // return if the ground or coordinates is not loaded yet
    if (!this.coordinates.isInitialized() || !this.ground.mesh) {
      return;
    }

    this.routingPoint = this.getGeolocation(event);
  }

  onMouseMoveHandler(event) {
    if (this.routingPoint) {
      this.routingEditor.drawRoutingPointArrow(
        this.getGeolocation(event), this.routingPoint, this.coordinates, this.scene, this.startMove,
      );
      this.startMove = true;
    }
  }

  onMouseUpHandler() {
    if (this.routingPoint) {
      const selectedParkingSpaceIndex = this.routingEditor.addRoutingPoint(
        this.routingPoint, this.coordinates, this.scene, false,
      );
      if (selectedParkingSpaceIndex !== -1) {
        this.map.changeSelectedParkingSpaceColor(selectedParkingSpaceIndex);
      }
    }
    this.routingPoint = null;
    this.startMove = false;
  }

  // Render one frame. This supports the main draw/render loop.
  render() {
    // TODO should also return when no need to update.
    if (!this.coordinates.isInitialized()) {
      return;
    }

    // Return if the car mesh is not loaded yet, or the ground is not
    // loaded yet.
    if (!this.adc.mesh || !this.ground.mesh) {
      return;
    }

    // Upon the first time in render() it sees ground mesh loaded,
    // added it to the scene.
    if (this.ground.type === 'default' && !this.ground.initialized) {
      this.ground.initialize(this.coordinates);
      this.ground.mesh.name = 'ground';
      this.scene.add(this.ground.mesh);
    }

    if (this.pointCloud.initialized === false) {
      this.pointCloud.initialize();
      this.scene.add(this.pointCloud.points);
    }

    const target = (STORE.options.showVirtualCloseLoop || STORE.options.showCloseLoop) ? this.closeLoopAdc.mesh : this.adc.mesh;
    this.adjustCamera(target, this.options.cameraAngle);
    this.renderer.render(this.scene, this.camera);
    if (this.lanmapLoad) {
      this.enableOrbitLanemap();
      this.rendererLanemap.render(this.sceneLanemap, this.cameraLanemap);
    }
    if (this.pncNnLoad) {
      this.enableOrbitPncNn();
      this.rendererPncNn.render(this.scenePncNn, this.cameraPncNn);
    }
    if (this.pncPreLoad) {
      this.enableOrbitPncPre();
      this.rendererPncPre.render(this.scenePncPre, this.cameraPncPre);
    }
  }

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });

    if (this.stats) {
      this.stats.update();
    }
    this.render();
  }

  updateWorld(world) {
    this.world = world;

    const adcPose = world.autoDrivingCar;
    this.adc.update(this.coordinates, adcPose);
    if (!_.isNumber(adcPose.positionX) || !_.isNumber(adcPose.positionY)) {
      console.error(`Invalid ego car position: ${adcPose.positionX}, ${adcPose.positionY}!`);
      return;
    }

    this.adc.updateRssMarker(world.isRssSafe);
    this.ground.update(world, this.coordinates, this.scene);
    this.planningTrajectory.update(world, world.planningData, this.coordinates, this.scene, this.camera);
    this.planningStatus.update(world.planningData, this.coordinates, this.scene);
    this.planningMultiPolicy.update(world, this.coordinates, this.scene);

    const isBirdView = ['Overhead', 'Map', 'Orthographic'].includes(_.get(this, 'options.cameraAngle'));
    // this.perceptionObstacles.update(world, this.coordinates, this.scene, isBirdView);
    if (this.camera !== undefined) {
      let size = 0.6;
      if (this.camera instanceof THREE.OrthographicCamera) {
        size = 1.1;
        this.perceptionObstaclesNew2.resetObjects(this.scene, true);
        this.perceptionObstaclesNew.update(world, this.coordinates, this.scene, this.camera, size, isBirdView);
      } else if (this.camera instanceof THREE.PerspectiveCamera) {
        size = 0.6;
        this.perceptionObstaclesNew.resetObjects(this.scene, true);
        this.perceptionObstaclesNew2.update(world, this.coordinates, this.scene, this.camera, size, isBirdView);
      }
    }

    // this.perceptionObstaclesNew.update(world, this.coordinates, this.scene, this.camera, isBirdView);
    this.decision.update(world, this.coordinates, this.scene);
    this.prediction.update(world, this.coordinates, this.scene, this.camera);
    this.updateRouting(world.routingTime, world.routePath);
    this.gnss.update(world, this.coordinates, this.scene);
    this.map.update(world, this.coordinates, this.scene);
    this.roadStructure.update(world, this.coordinates, this.scene, this.camera);
    this.perceptionRoadStructure.update(world, this.coordinates, this.scene, this.camera);
    this.roadStructureNet.update(world, this.coordinates, this.scene);
    this.naviTwoKm.update(world, this.coordinates, this.scene, this.camera);
    if (STORE.options.showLaneMap) {
      this.adcLanemap.update(this.coordinates2, adcPose, world, this.sceneLanemap);
      this.LaneMap.updateLaneMap(world, this.coordinates2, this.sceneLanemap, this.cameraLanemap);
    }
    if (STORE.options.showPncNnCanvas) {
      this.adcPncNn.update(this.coordinatesPncNn, adcPose, world, this.scenePncNn);
      this.PncNn.update(world, this.coordinatesPncNn, this.scenePncNn, this.cameraPncNn);
    }
    this.TopoTree.updateTopoTree(world, this.coordinates, this.scene, this.camera);
    this.PerceptioCurb.update(world, this.coordinates, this.scene);
    this.BehaviorMap.update(world, this.coordinates, this.scene, this.camera);

    const planningAdcPose = _.get(world, 'planningData.initPoint.pathPoint');
    if (this.planningAdc && planningAdcPose) {
      const pose = {
        positionX: planningAdcPose.x,
        positionY: planningAdcPose.y,
        heading: planningAdcPose.theta,
      };
      this.planningAdc.update(this.coordinates, pose);
    }

    const closeLoopPose = Object.assign({}, world.virtualCar);
    if (this.closeLoopAdc && closeLoopPose) {
      this.closeLoopAdc.update(this.coordinates, closeLoopPose);
    }
    // closeLoopPose.positionX = closeLoopPose.positionX + 3;
    // closeLoopPose.positionY = closeLoopPose.positionY - 4;

    const shadowLocalizationPose = world.shadowLocalization;
    if (shadowLocalizationPose) {
      const shadowAdcPose = {
        positionX: shadowLocalizationPose.positionX,
        positionY: shadowLocalizationPose.positionY,
        heading: shadowLocalizationPose.heading,
      };
      this.shadowAdc.update(this.coordinates, shadowAdcPose);
    }

    // add voice prompt: navigation lane change
    const naviLaneChangePrompt = _.get(world, 'naviLaneChangePrompt');
    UTTERANCE.speakOnce(`${naviLaneChangePrompt || ''}`);
  }

  updateRouting(routingTime, routePath) {
    this.routing.update(routingTime, routePath, this.coordinates, this.scene);
  }

  updateGroundImage(mapName) {
    this.ground.updateImage(mapName);
  }

  updateGroundMetadata(mapInfo) {
    this.ground.initialize(mapInfo);
  }

  updateMap(newData, removeOldMap = false) {
    if (removeOldMap) {
      this.map.removeAllElements(this.scene);
    }
    const extraInfo = this.map.appendMapData(newData, this.coordinates, this.scene);
    if (newData.parkingSpace && !_.isEmpty(extraInfo[0])) {
      this.routingEditor.setParkingSpaceInfo(
        newData.parkingSpace, extraInfo[0], this.coordinates, this.scene
      );
    }
  }

  updatePointCloud(pointCloud) {
    if (!this.coordinates.isInitialized() || !this.adc.mesh) {
      return;
    }
    pointCloud.deltaT1 && STORE.meters.updateStatus({deltaTime1_point_cloud: {pcd: pointCloud.deltaT1}});
    pointCloud.timestamp && STORE.meters.updateStatus({deltaTime2_point_cloud: {pcd: pointCloud.timestamp}});
    this.pointCloud.update(pointCloud, this.adc.mesh);
  }

  updateMapIndex(hash, elementIds, radius) {
    // if (!this.routingEditor.isInEditingMode()
    //         || PARAMETERS.routingEditor.radiusOfMapRequest === radius) {
    //   this.map.updateIndex(hash, elementIds, this.scene);
    // }
  }

  isMobileDevice() {
    return navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i);
  }

  getGeolocation(event) {
    if (!this.coordinates.isInitialized()) {
      return;
    }

    const canvasPosition = event.currentTarget.getBoundingClientRect();

    const vector = new THREE.Vector3(
      ((event.clientX - canvasPosition.left) / this.dimension.width) * 2 - 1,
      -((event.clientY - canvasPosition.top) / this.dimension.height) * 2 + 1,
      0,
    );

    vector.unproject(this.camera);
    if (this.camera.isOrthographicCamera) {
      const direction = vector.sub(this.camera.position);
      const pos = this.camera.position.clone().add(direction);
      const geo = this.coordinates.applyOffset(pos, true);
      return geo;
    } else {
      const direction = vector.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / direction.z;
      const pos = this.camera.position.clone().add(direction.multiplyScalar(distance));
      const geo = this.coordinates.applyOffset(pos, true);
      return geo;
    }
  }

  // Debugging purpose function:
  //  For detecting names of the lanes that your mouse cursor points to.
  getMouseOverLanes(event) {
    const canvasPosition = event.currentTarget.getBoundingClientRect();
    const mouse = new THREE.Vector3(
      ((event.clientX - canvasPosition.left) / this.dimension.width) * 2 - 1,
      -((event.clientY - canvasPosition.top) / this.dimension.height) * 2 + 1,
      0,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const objects = this.map.data.lane.reduce(
      (result, current) => result.concat(current.drewObjects), []);
    const intersects = raycaster.intersectObjects(objects);
    const names = intersects.map((intersect) => intersect.object.name);
    return names;
  }

  checkCycleRoutingAvailable(points, threshold) {
    return this.routingEditor.checkCycleRoutingAvailable(points,
      this.adc.mesh.position, threshold);
  }

  checkDistance() {
    this.distance.update(STORE.meters.distanceList, this.coordinates, this.scene, this.camera);
  }

  removeDistanceMesh() {
    this.distance.disposeMeshes(this.scene);
  }

  drawCarHistoryLocal(list) {
    this.carHistoryLocal.update(list, this.coordinates, this.scene);
  }

  reset() {
    this.initPerspective = false;
    this.initOrthographic = false;
  }

  initPncPre() {
    if (STORE.options.showPncPre) {
      this.pncPreWorld = _.cloneDeep(this.world);
      const scenes = this.pncPreWorld?.planningData?.multiPolicyDebug?.scenes || [];
      let pncPreList = [];
      if (this.pncPreWorld.laneChangeFsmStatus === 'IN_LANE_CHANGE') {
        const sc = scenes.find(item => item.egoForwardPath.name === 'lc scene');
        pncPreList = sc?.egoForwardPath?.pathPoint || [];
      } else {
        const sc = scenes.find(item => item.egoForwardPath.name === 'lk scene');
        pncPreList = sc?.egoForwardPath?.pathPoint || [];
      }
      STORE.meters.updatePncPreList(pncPreList);
      const adcPose = this.pncPreWorld.autoDrivingCar;
      this.adcPncPre.update(this.coordinatesPncPre, adcPose, this.pncPreWorld, this.scenePncPre);
      this.roadStructurePncPre.update(this.pncPreWorld, this.coordinatesPncPre, this.scenePncPre, this.cameraPncPre);
      this.pncPreObstacles.update(this.pncPreWorld, this.coordinatesPncPre, this.scenePncPre, this.cameraPncPre, 1.0, false);
    }
  }

  updatePncPre(index) {
    if (STORE.options.showPncPre) {
      this.pncPreWorld.pncPreWorldIndex = index;
      const adcPose = STORE.meters.pncPreList[index];
      const adcPose2 = {
        positionX: adcPose.x,
        positionY: adcPose.y,
        heading: adcPose.theta,
      };
      this.adcPncPre.update(this.coordinatesPncPre, adcPose2, this.world, this.scenePncPre);
      this.pncPreObstacles.update(this.pncPreWorld, this.coordinatesPncPre, this.scenePncPre, this.cameraPncPre, 1.0, false);
    }
  }
}

const RENDERER = new Renderer();

export default RENDERER;
