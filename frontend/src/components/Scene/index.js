import React from 'react';
import { observer, inject } from 'mobx-react';
import Draggable from 'react-draggable';
import { reaction } from 'mobx';
import Geolocation from 'components/Scene/Geolocation';
import RENDERER from 'renderer';
import STORE from 'store';
import DefaultRoutingInput from '../RouteEditingBar/DefaultRoutingInput';
import CycleNumberInput from '../DefaultRouting/CycleNumberInput';
import AMapLoader from '@amap/amap-jsapi-loader';
import { getUrlParam, fetchRequest } from 'utils/misc';
import GPS from 'utils/gpstoGD';
import CarIcon from 'assets/images/car.png';
import PncPre from '../PncPre';

let map = null;
let AMap = null;
let carMarker = null;
let initGdMapPos = null;
@inject('store') @observer
export default class Scene extends React.Component {
  componentDidMount() {
    RENDERER.initialize('canvas', this.props.width, this.props.height,
      this.props.options, this.props.store.cameraData);
    // RENDERER.updateDimension(this.props.width, this.props.height);
    this.disposeLanemap = reaction(
      () => this.props.store.options.showLaneMap,
      (showLaneMap) => {
        if (showLaneMap) {
          setTimeout(() => {
            RENDERER.lanemapInitialize('lanemap-canvas', this.props.width * 0.3, this.props.height * 0.3);
          }, 500);
        }
      },
      { fireImmediately: true }
    );
    this.disposePncNn = reaction(
      () => this.props.store.options.showPncNnCanvas,
      (showPncNnCanvas) => {
        if (showPncNnCanvas) {
          setTimeout(() => {
            RENDERER.pncNnInitialize('pnc-nn-canvas', this.props.width * 0.35, this.props.height * 0.35);
          }, 500);
        }
      },
      { fireImmediately: true }
    );
    const issueKey = getUrlParam('issueKey');
    this.disposeGdMap = reaction(
      () => this.props.store.options.showGdMap,
      (showGdMap) => {
        if (showGdMap) {
          this.initIssueMap(issueKey);
        } else {
          map = null;
          AMap = null;
          carMarker = null;
        }
      }
    );
    this.disposeAutoCar = reaction(
      () => this.props.store.autoDrivingCar.autoDrivingCar,
      (autoDrivingCar) => {
        if (autoDrivingCar.longitude && autoDrivingCar.latitude) {
          this.updateCarPosting(autoDrivingCar);
          if (!initGdMapPos) {
            initGdMapPos = {
              lng: autoDrivingCar.longitude,
              lat: autoDrivingCar.latitude
            };
          }
        }
      }
    );
    if (issueKey) {
      this.getTripInfo(issueKey);
    }
  }

  async getTripInfo(issueKey) {
    try {
      const url = `http://datainfra.robosense.cn/api/trip_issue/get_trip_issue_info?issueKey=${issueKey}`;
      const res = await fetchRequest({ url });
      if (res.code === 200) {
        const tripId = res?.data?.tripId || '';
        const quickDataRecordUrl = res?.data?.quickDataRecordUrl || '';
        this.props.store.meters.updateTripId(tripId);
        this.props.store.meters.updateTripDetail(res?.data || {});
        this.props.store.meters.updateQuickDataRecordUrl(quickDataRecordUrl);
      }
    } catch (error) {

    }
  }

  async initIssueMap(issueKey) {
    const iconMap = {
      start: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
      mid: 'https://webapi.amap.com/theme/v1.3/markers/n/mid.png',
      end: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
    };
    try {
      const url = `http://datainfra.robosense.cn/api/trip_issue/get_extra_position_info?issueKey=${issueKey}`;
      const res = await fetchRequest({ url });
      let posList = [];
      let issuePosition = '';
      if (res.code === 200) {
        posList = res?.data?.extraPositionInfo || [];
        issuePosition = res?.data?.position || [];
      }
      AMap = await AMapLoader.load({
        key: '1e1679b70693fe6338c54bf2f9b2703d', //设置您的key
        version: '2.0',
        plugins: ['AMap.PolylineEditor', 'AMap.MouseTool', 'AMap.PolygonEditor'],
        AMapUI: {
          version: '1.1',
          plugins: []
        },
        Loca: {
          version: '2.0.0'
        }
      });
      map = new AMap.Map('issue-map-container', {
        resizeEnable: true,
        zoom: 14,
        // center: [113.945074898163, 22.5828987078255]
        center: [initGdMapPos.lng || 113.945074898163, initGdMapPos.lat || 22.5828987078255]
      });
      let isDragging = false;
      let startMousePos = null;

      map.on('mousedown', function (e) {
        isDragging = true;
        startMousePos = e.pixel;
      });

      map.on('mousemove', function (e) {
        if (isDragging && startMousePos) {
          const endMousePos = e.pixel;
          const deltaX = endMousePos.x - startMousePos.x;
          const deltaY = endMousePos.y - startMousePos.y;
          map.panBy(deltaX, deltaY);
          startMousePos = endMousePos;
        }
      });

      map.on('mouseup', function () {
        isDragging = false;
        startMousePos = null;
      });
      if (posList.length) {
        posList.forEach(function (pos, i) {
          const polyLine = new AMap.Polyline({
            map: map,
            strokeColor: 'blue',  //线颜色
            strokeWeight: 4,    //线宽
            strokeOpacity: 1,
            zIndex: 99
          });
          const gdList = pos.map(item => {
            const GD = GPS.gcj_encrypt(Number(item['latitude']), Number(item['longitude']));
            return [GD.lng, GD.lat];
          });
          polyLine.setPath(gdList);
          if (i === 0) {
            const startPos = gdList[0];
            new AMap.Marker({
              position: [startPos[0], startPos[1]],
              map: map,
              icon: iconMap.start,
              offset: new AMap.Pixel(-9, -31),
            });
          }
          if (i === posList.length - 1) {
            const endPos = gdList[gdList.length - 1];
            new AMap.Marker({
              position: [endPos[0], endPos[1]],
              map: map,
              icon: iconMap.end,
              offset: new AMap.Pixel(-9, -31),
            });
          }
        });
      }
      if (issuePosition) {
        const posArr = issuePosition?.split(',') || [];
        const GD = GPS.gcj_encrypt(Number(posArr[1]), Number(posArr[0]));
        const marker = new AMap.Marker({
          position: [GD.lng, GD.lat],
          map: map,
        });
        marker.on('click', () => {
          const tripUrl = `http://datainfra.robosense.cn/fsd_auto/trip_detail/${STORE.meters.tripId}?tab=tripTrace&issueKey=${issueKey}`;
          window.open(tripUrl, '_blank');
        });
        map.setCenter([Number(posArr[0]), Number(posArr[1])]);
      } else {
        const lastPoint = posList[posList.length - 1];
        map.setCenter([Number(lastPoint.longitude), Number(lastPoint.latitude)]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  updateCarPosting(autoDrivingCar) {
    if (!AMap) {
      return;
    }
    if (autoDrivingCar.longitude && autoDrivingCar.latitude) {
      const GD = GPS.gcj_encrypt(Number(autoDrivingCar.latitude), Number(autoDrivingCar.longitude));
      if(!carMarker) {
        carMarker = new AMap.Marker({
          position: [GD.lng, GD.lat],
          map: map,
          icon: CarIcon,
          offset: new AMap.Pixel(-15, -15)
        });
      } else {
        carMarker.setPosition([GD.lng, GD.lat]);
      }
    }
  }

  handleCanvasClick = () => {
    if (STORE.options.showDistance && STORE.geolocation.x && STORE.geolocation.y) {
      STORE.meters.updateDistanceList([...STORE.meters.distanceList, {x:STORE.geolocation.x, y: STORE.geolocation.y}]);
      RENDERER.checkDistance();
    }
  };

  componentWillUpdate(nextProps) {
    if (nextProps.width !== this.props.width
            || nextProps.height !== this.props.height) {
      // The dimension of the renderer should always be consistent with
      // the dimension of this component.
      RENDERER.updateDimension(nextProps.width, nextProps.height);
    }
  }

  componentWillUnmount() {
    this.disposeLanemap();
    this.disposeGdMap();
    this.disposeAutoCar();
  }

  render() {
    const { options, shouldDisplayOnRight, width, height } = this.props;
    const { routeEditingManager } = this.props.store;

    const shouldDisplayCameraImage = options.showCameraView && !options.showRouteEditingBar;
    const leftPosition = shouldDisplayOnRight ? '50%' : '0%';

    return (
            <React.Fragment>
                {shouldDisplayCameraImage && <img id="camera-image" />}
                <div
                    id="canvas"
                    className="dreamview-canvas"
                    style={{ left: leftPosition }}
                    onMouseMove={(event) => {
                      const geo = RENDERER.getGeolocation(event);
                      STORE.setGeolocation(geo);
                    }}
                    onClick={this.handleCanvasClick}
                >
                    {options.showRouteEditingBar && options.showDefaultRoutingInput
                        && <DefaultRoutingInput
                            routeEditingManager={routeEditingManager}
                            options={options}
                        />}
                    {!options.showRouteEditingBar && options.showCycleNumberInput
                        && <CycleNumberInput
                            routeEditingManager={routeEditingManager}
                            options={options}
                        />}
                    {options.showGeo && <Geolocation />}
                    {options.showLaneMap && <Draggable>
                      <div className="lanemap-canvas" id="lanemap-canvas" onWheel={e => {
                        RENDERER.scaleLanemap(e.deltaY);
                      }}></div>
                    </Draggable>}
                    {options.showPncNnCanvas && <Draggable>
                      <div className="pnc-nn-canvas" id="pnc-nn-canvas" onWheel={e => {
                        RENDERER.scalePncNn(e.deltaY);
                      }}></div>
                    </Draggable>}
                    <PncPre
                      options={options}
                      width={width}
                      height={height}
                    />
                    {options.showGdMap && <Draggable>
                      <div className="issue-map" id="issue-map-container">
                        {<div className="loading">加载中请勿操作...</div>}
                      </div>
                    </Draggable>}
                </div>
            </React.Fragment>
    );
  }
}
