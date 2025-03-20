const protobuf = require('protobufjs/light');
const simWorldRoot = protobuf.Root.fromJSON(
  require('proto_bundle/cache_sim_world_proto_bundle.json'),
);

const SimWorldMessage = simWorldRoot.lookupType('apollo.cachedreamview.SimulationWorldToSend');

export default class RealtimeWebSocketWorker {
  constructor() {
    this.websocket = null;

    // 绑定 handleMessage 方法的 this 上下文
    this.handleMessage = this.handleMessage.bind(this);
    this.handleWorkerMessage = this.handleWorkerMessage.bind(this);
  }

  initialize(serverAddr, params) {
    try {
      this.websocket = new WebSocket(serverAddr);
      this.websocket.binaryType = 'arraybuffer';
    } catch (error) {
      console.error(`Failed to establish a connection: ${error}`);
      return;
    }

    this.websocket.onopen = (event) => {
      // 在这里执行数据预加载等逻辑
      this.preloadBinaryInfo(params);
    };

    this.websocket.onmessage = (event) => {
      // 处理从 WebSocket 接收到的消息
      this.handleMessage(event.data);
    };

  }

  preloadBinaryInfo(params) {
    this.websocket.send(params);
  }

  sendWobsocketMsg(data) {
    this.websocket.send(data);
  }

  handleMessage(data) {
    // 处理从 WebSocket 接收到的消息
    // 将数据发送回主线程
    let message = null;
    if (typeof data === 'string') {
      message = data;
      // console.log(message);
    } else {
      message = data;
    }
    self.postMessage(message);
  }
  // 添加一个方法来处理来自主线程的消息
  handleWorkerMessage(event) {
    const { type, data } = event.data;
    if (type === 'sendWobsocketMsg') {
      // 在这里处理来自主线程的消息
      this.sendWobsocketMsg(data);
    }
    if (type === 'initialize') {
      this.initialize(data.serverAddr, data.params);
    }
  }
}

// 创建一个实例
const realtimeWebSocketWorker = new RealtimeWebSocketWorker();

// 在 Web Worker 内部监听主线程消息
self.addEventListener('message', realtimeWebSocketWorker.handleWorkerMessage.bind(realtimeWebSocketWorker));

