import OfflinePlaybackWebSocketEndpoint from 'store/websocket/websocket_offline';
import RealtimeWebSocketEndpoint from 'store/websocket/websocket_realtime';
import MapDataWebSocketEndpoint from 'store/websocket/websocket_map';
import PointCloudWebSocketEndpoint from 'store/websocket/websocket_point_cloud';
import CameraDataWebSocketEndpoint from 'store/websocket/websocket_camera';
import TeleopWebSocketEndpoint from 'store/websocket/websocket_teleop';
import PluginWebSocketEndpoint from 'store/websocket/websocket_plugin';
import RealtimeAjaxEndpoint from 'store/websocket/ajax_realtime';

// Returns the websocket server address based on the web server address.
// Follows the convention that the websocket is served on the same host/port
// as the web server.
function deduceWebsocketServerAddr(type) {
  const server = window.location.origin;
  const link = document.createElement('a');
  link.href = server;
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const port = process.env.NODE_ENV === 'production' ? window.location.port : PARAMETERS.server.port;

  let path = '';
  switch (type) {
    case 'map':
      path = 'map';
      break;
    case 'point_cloud':
      path = 'pointcloud';
      break;
    case 'sim_world':
      path = OFFLINE_PLAYBACK ? 'offlineView' : 'websocket';
      break;
    case 'camera':
      path = 'camera';
      break;
    case 'teleop':
      path = 'teleop';
      break;
    case 'plugin':
      path = 'plugin';
      break;
  }
  let pathname = '';
  if (window.location.pathname !== '/') {
    pathname = window.location.pathname;
  }
  return `${protocol}://${link.hostname}:${port}${pathname}/${path}`;
  // return `${protocol}://10.30.65.89:${port}${pathname}/${path}`;
}

// NOTE: process.env.NODE_ENV will be set to "production" by webpack when
// invoked in production mode ("-p"). We rely on this to determine which
// websocket server to use.
const simWorldServerAddr = deduceWebsocketServerAddr('sim_world');

const mapServerAddr = deduceWebsocketServerAddr('map');
export const MAP_WS = new MapDataWebSocketEndpoint(mapServerAddr);

const pointCloudServerAddr = deduceWebsocketServerAddr('point_cloud');
export const POINT_CLOUD_WS = new PointCloudWebSocketEndpoint(pointCloudServerAddr);

const cameraServerAddr = deduceWebsocketServerAddr('camera');
export const CAMERA_WS = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData');
export const CAMERA_WS2 = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData2');
export const CAMERA_WS3 = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData3');
export const CAMERA_WS4 = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData4');
export const CAMERA_WS5 = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData5');
export const CAMERA_WS6 = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData6');
export const CAMERA_WS7 = new CameraDataWebSocketEndpoint(cameraServerAddr, 'cameraData7');

const pluginServerAddr = deduceWebsocketServerAddr('plugin');
export const PLUGIN_WS = new PluginWebSocketEndpoint(pluginServerAddr);

const WS = OFFLINE_PLAYBACK
  ? new OfflinePlaybackWebSocketEndpoint(simWorldServerAddr)
  : new RealtimeWebSocketEndpoint(simWorldServerAddr);

WS.setPointCloudWS(POINT_CLOUD_WS);
export default WS;

const teleopServerAddr = deduceWebsocketServerAddr('teleop');
export const TELEOP_WS = new TeleopWebSocketEndpoint(teleopServerAddr);

export const RA = new RealtimeAjaxEndpoint();
