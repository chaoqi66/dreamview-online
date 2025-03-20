import { action, computed, observable } from 'mobx';
import STORE from 'store';
import 'styles/playback-controls';
import WS, { RA, CAMERA_WS, CAMERA_WS2, CAMERA_WS3, CAMERA_WS4, CAMERA_WS5, CAMERA_WS6, CAMERA_WS7 } from 'store/websocket';
import RENDERER from 'renderer';

export default class Playback {
  FPS = 10; // frames per sec


  recordId = null;

  mapId = null;

    // real frame number starts from 1
    @observable msPerFrame = 100;

    @observable cacheDataCurIndex = 0;

    @observable currentLoadingId = 0;

    @observable currTimeS = 0;

    @observable totalTimeS = 30;

    @observable playRecordStatus = 'CLOSED';

    @observable rate = 1.0;

    @observable isDataReady = false;

    @observable issueTimeRange = [];

    @observable controlBarInfo = [];

    @observable requestedFrame = 0;

    @observable retrievedFrame = 0;

    @observable loadingMarker = 0;

    @observable isPlaying = false;

    @observable isSeeking = true;

    @observable seekingFrame = 1;

    @observable cameraChannel = [
      // { label: 'camera_fm_wide', value: '/camera_fm_wide/image_color/compressed' },
      // { label: 'camera_lb_pinhole', value: '/camera_lb_pinhole/image_color/compressed' }
    ];

    setCacheDataCurIndex(index) {
      this.cacheDataCurIndex = index;
      RA.loadSimulationWorld(index, 2);
    }
    setDreamviewData(cacheData) {
      this.currTimeS = cacheData['timestamp'] / 1e9 - this.controlBarInfo[0].timestamp / 1e9;

      const simulationWordData = cacheData['simulationWorld'];
      simulationWordData.type = 'SimWorldUpdate';
      RA.setMessageData(simulationWordData);


      if (cacheData) {
        const camera_data = cacheData && cacheData['cameraData'];
        STORE.options.showVideo && camera_data && CAMERA_WS.setCameraData(camera_data);
        STORE.options.showVideo2 && camera_data && CAMERA_WS2.setCameraData(camera_data);
        STORE.options.showVideo3 && camera_data && CAMERA_WS3.setCameraData(camera_data);
        STORE.options.showVideo4 && camera_data && CAMERA_WS4.setCameraData(camera_data);
        STORE.options.showVideo5 && camera_data && CAMERA_WS5.setCameraData(camera_data);
        STORE.options.showVideo6 && camera_data && CAMERA_WS6.setCameraData(camera_data);
        STORE.options.showVideo7 && camera_data && CAMERA_WS7.setCameraData(camera_data);
      } else {
        // console.log('camera_data is null');
      }

      const pointCloud = cacheData['pointCloud'] || {};

      if (pointCloud && STORE.options.showPointCloud === true && pointCloud.num !== undefined) {
        console.log(pointCloud.num.length);
        RENDERER.updatePointCloud(pointCloud);
      }
      if (STORE.options.showPointCloud === false) {
        RENDERER.updatePointCloud({ num: [] });
      }

    }

    setPlayRecordStatus(status) {
      this.playRecordStatus = status;
    }

    setIsDataReady() {
      this.isDataReady = true;
    }

    resetRecordProgress(percentage) {
      let clikIndex = parseInt(percentage * this.controlBarInfo.length);
      if (clikIndex > this.controlBarInfo.length - 1) {
        clikIndex = this.controlBarInfo.length - 1;
      }
      this.cacheDataCurIndex = clikIndex;
      RA.loadSimulationWorld(clikIndex, 3);
    }

    setCameraChannel(camera_data) {
      if (camera_data && JSON.stringify(camera_data) !== '{}') {
        this.cameraChannel = Object.keys(camera_data).map(item => {
          return {
            label: item.split('/')[1],
            value: item
          };
        });
      }
    }

    setControlBarInfo(data) {
      this.controlBarInfo = data;
    }

    setIssueTimeRange(data) {
      this.issueTimeRange = data;
    }
    setMapId(mapId) {
      this.mapId = mapId;
    }

    setRecordId(recordId) {
      this.recordId = recordId;
    }

    setNumFrames(numFrames) {
      this.numFrames = parseInt(numFrames);
    }

    setPlayRate(rate) {
      this.msPerFrame = 100 / rate;
      RA.createCacheTimer();
      this.rate = rate;
    }

    initialized() {
      return this.numFrames && this.recordId !== null && this.mapId !== null;
    }

    hasNext() {
      return this.initialized() && this.requestedFrame < this.numFrames;
    }

    @action next() {
      this.requestedFrame++;
      return this.requestedFrame;
    }

    @computed get currentFrame() {
      return this.retrievedFrame;
    }

    @computed get replayComplete() {
      return this.seekingFrame > this.numFrames;
    }

    @action setPlayAction(status) {
      this.isPlaying = status;
    }

    @action seekFrame(frame) {
      if (frame > 0 && frame <= this.numFrames) {
        this.seekingFrame = frame;
        this.requestedFrame = frame - 1;
        this.isSeeking = true;
      }
    }

    @action resetFrame() {
      this.requestedFrame = 0;
      this.retrievedFrame = 0;
      this.seekingFrame = 1;
    }

    @action shouldProcessFrame(world) {
      if (world && world.sequenceNum) {
        if (this.seekingFrame === world.sequenceNum && (this.isPlaying || this.isSeeking)) {
          this.retrievedFrame = world.sequenceNum;
          this.isSeeking = false;
          this.seekingFrame++;
          return true;
        }
      }

      return false;
    }

    @action setLoadingMarker(frameId) {
      this.loadingMarker = frameId;
    }
}
