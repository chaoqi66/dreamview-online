import STORE from 'store';
import RENDERER from 'renderer';
import Worker from 'utils/webworker.js';

export default class MapDataWebSocketEndpoint {
  constructor(serverAddr) {
    this.serverAddr = serverAddr;
    this.websocket = null;
    this.currentMode = null;
    this.worker = new Worker();
    this.mapSocketIsConnect = false;

    this.dataSize = 0;
  }

  initialize(serverAddr) {
    try {
      if (serverAddr) {
        this.serverAddr = serverAddr.replace('http', 'ws') + '/map';
      }
      this.websocket = new WebSocket(this.serverAddr);
      this.websocket.binaryType = 'arraybuffer';
    } catch (error) {
      console.error(`Failed to establish a connection: ${error}`);
      setTimeout(() => {
        // this.initialize();
      }, 1000);
      return;
    }

    clearInterval(this.dataSizeTimer);
    this.dataSizeTimer = setInterval(() => {
      // console.log('websocketMap = ', this.dataSize / (1024 * 1024));
      STORE.meters.updateMapMessageSize(this.dataSize);
      this.dataSize = 0;
    }, 1000);

    this.websocket.onmessage = (event) => {
      this.worker.postMessage({
        source: 'map',
        data: event.data,
      });
    };
    this.worker.onmessage = (event) => {
      const message = event.data;
      const messageSize = JSON.stringify(message).length;
      // console.log('websocketMap messageSize = ', messageSize);
      this.dataSize += messageSize;

      const removeOldMap =
                STORE.hmi.inNavigationMode || this.currentMode !== STORE.hmi.currentMode;
      this.currentMode = STORE.hmi.currentMode;
      // console.log('map data', event.data);
      RENDERER.updateMap(event.data, removeOldMap);
      // STORE.setInitializationStatus(true);
    };
    this.websocket.onclose = (event) => {
      console.log(`WebSocket connection closed with code: ${event.code}`);
      // this.initialize();
    };
    this.websocket.onopen = (event) => {
      this.mapSocketIsConnect = true;
    };
  }
  setMapData(message) {
    const messageSize = JSON.stringify(message).length;
    // console.log('websocketMap messageSize = ', messageSize);
    this.dataSize += messageSize;

    const removeOldMap =
              STORE.hmi.inNavigationMode || this.currentMode !== STORE.hmi.currentMode;
    this.currentMode = STORE.hmi.currentMode;
    RENDERER.updateMap(event.data, removeOldMap);
    // STORE.setInitializationStatus(true);

  }
  requestMapData(elements) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RetrieveMapData',
      elements,
    }));
  }

  requestRelativeMapData(elements) {
    this.websocket && this.websocket.send(JSON.stringify({
      type: 'RetrieveRelativeMapData',
      elements,
    }));
  }
}
