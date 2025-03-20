import STORE from 'store';
import RENDERER from 'renderer';
import MAP_NAVIGATOR from 'components/Navigation/MapNavigator';
import axios from 'axios';
import WS from '.';
import { getUrlParam, fetchRequest } from 'utils/misc';
import { Modal, Select } from 'antd';
import React from 'react';

const protobuf = require('protobufjs/light');
const simWorldRoot = protobuf.Root.fromJSON(
  require('proto_bundle/cache_sim_world_proto_bundle.json'),
);

const SimWorldMessage = simWorldRoot.lookupType('apollo.cachedreamview.SimulationWorldToSend');

const historyLocalizationRoot = protobuf.Root.fromJSON(
  require('proto_bundle/history_localization_bundle.json'),
);
const historyRoot = protobuf.Root.fromJSON(
  require('proto_bundle/history_bundle.json'),
);
const HistoryLocalizationMsg = historyLocalizationRoot.lookupType('apollo.history_localization.CarCoordinate');
const HistoryMsg = historyRoot.lookupType('apollo.History');
let notifyUserId = '';

export default class RealtimeAjaxEndpoint {
  constructor() {
    this.websocket = null;
    this.simWorldLastUpdateTimestamp = 0;
    this.mapUpdatePeriodMs = 1000;
    this.mapLastUpdateTimestamp = 0;
    this.updatePOI = true;
    this.updateDefaultRoutingPoints = true;
    this.routingTime = undefined;

    this.dataSize = 0;

    this.issueBinaryId = '';
    this.nextClipStartIndex = 0;
    this.isLoadSimulaitonWord = false;

    this.binaryInfo = [];
    this.leftBinaryIds = [];
    this.rightBinaryIds = [];
    this.hasLoadedBinaryNums = 0;
    this.nextArrow = null;

    this.preloadIds = [];
    this.isLoading = false;
    this.cancelTokenSource = null;
  }
  handleDataDelete() {
    const issueKey = getUrlParam('issueKey');
    fetchRequest({
      url: `http://datainfra.robosense.cn/api/trip_issue/check_parser_status/${issueKey}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(response => {
      console.log(response);
      if (response?.data?.repostJobStatus === 'running') {
        Modal.success({
          title: '正在运行中',
          content: '数据正在重刷中，大约需要十几分钟，请重新从OB单打开页面。',
          okText: '关闭当前网页',
          onOk: () => {
            window.close();
          }
        });
      } else {
        fetchRequest({
          url: 'http://datainfra.robosense.cn/api/system/user/list_all',
          method: 'get',
          headers: {
            'Content-Type': 'application/json'
          },
        }).then(userRes => {
          const userList = userRes?.data || [];
          Modal.confirm({
            title: 'dreamview缓存数据已删除',
            content: (
              <div>
                <p>是否需要重刷数据，重刷后当前网页url会失效，请重新从OB单打开</p>
                {userList.length &&
                  <Select style={{ width: 220 }} showSearch optionFilterProp="children" placeholder="重刷成功后通知该用户"
                    options={userList.map(user => {
                      return {
                        label: user.userName,
                        value: user.userId,
                        key: user.userId,
                      };
                    })}
                    onChange={(value) => {
                      notifyUserId = value;
                    }}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                  </Select>
                }
              </div>
            ),
            okText: '重刷数据',
            cancelText: '取消',
            onOk() {
              const id = getUrlParam('issueId');
              fetchRequest({
                url: 'http://datainfra.robosense.cn/api/trip_issue/open/re_parser_dreamview_data',
                method: 'post',
                headers: {
                  'Content-Type': 'application/json'
                },
                data: { id, issueKey }
              }).then(res => {
                if (res.code === 200) {
                  Modal.success({
                    title: '操作成功',
                    content: '数据已提交重刷，大约需要十几分钟，请重新从OB单打开页面。',
                    okText: '关闭当前网页',
                    onOk: () => {
                      window.close();
                    }
                  });
                }
              });
              fetchRequest({
                url: 'http://datainfra.robosense.cn/api/trip_issue/add_parser_notify',
                method: 'post',
                headers: {
                  'Content-Type': 'application/json'
                },
                data: {
                  issueKey,
                  userId: notifyUserId
                }
              });
            },
            onCancel() {
              console.log('Cancel');
            },
          });
        });
      }
    });
  }

  async initialize() {
    try {
      const params = this.parseQueryString(window.location.search);
      const { eventTime, path, file_index, trip_id, clip_order, source = 'jira' } = params;
      let request = [];
      if (path && !file_index) {
        const files = path.split(',');
        request = files.map(item => {
          const arr = item.split('/');
          const lastThreeItems = arr.slice(-3);
          const s3path = 'http://10.199.2.100:8082/TenantAI:datahub/simulation_world_binary/'
            + lastThreeItems.join('/')
            + '/' + arr[arr.length - 1] + '.json';
          return this.fetchBinaryInfoFromS3(s3path);
        });
      }
      if (file_index) {
        const files = file_index.split(',');
        request = files.map(item => {
          return this.fetchBinaryInfoFromS3(decodeURIComponent(item));
        });
      }
      if (trip_id) {
        const data = { tripId: trip_id };
        if (clip_order) {
          data.clipOrderList = clip_order.split(',');
        }
        const res = await fetchRequest({
          url: 'http://datainfra.robosense.cn/api/clip_dreamview/list',
          data,
          method: 'post',
          headers: { 'Content-Type': 'application/json' }
        });
        request = res.data.map(item => {
          if (item.fileIndex !== 'null')
          {return this.fetchBinaryInfoFromS3(item.fileIndex);}
        });
      }
      if (!request.length) {
        const s3path = 'http://localhost:3001/simulation_world_binary/binary_file_index.json';
        request.push(this.fetchBinaryInfoFromS3(s3path));
      }

      Promise.all(request)
        .then(datas => {
          const binaryInfo = [].concat(...datas);
          binaryInfo.sort(this.sortBinaryDataId);
          const finalBinaryInfo = this.filterBinaryInfo(binaryInfo, eventTime, source);
          this.setMessageData({
            type: 'setBinaryInfo',
            data: finalBinaryInfo
          });

        })
        .catch(error => {
          console.log(error);
          if (error?.response?.status === 404) {
            this.handleDataDelete();
          } else {
            alert('获取数据包失败，请联系管理员');
          }
        });
    } catch (error) {
      console.log(error);
      return;
    }
    window.cacheData = new Map();

    clearInterval(this.dataSizeTimer);
    this.dataSizeTimer = setInterval(() => {
      STORE.meters.updateRealtimeMessageSize(this.dataSize);
      this.dataSize = 0;
    }, 1000);;

  }
  fetchBinaryInfoFromS3(path) {
    return new Promise((resolve, reject) => {
      axios.get(path)
        .then(res => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  filterBinaryInfo(binaryInfo, eventTime = 0, source) {
    if (!eventTime || source === 'sim' || source === 'quickData') {
      return binaryInfo;
    }
    const arr = [];
    let issueBinaryIndex = 0;
    for (let i = 0; i < binaryInfo.length; i++) {
      const el = binaryInfo[i];
      if (el[1] >= eventTime * 1e9) {
        issueBinaryIndex = i;
        break;
      }
    }
    if (issueBinaryIndex > 150) {
      const beforeArr = binaryInfo.slice(issueBinaryIndex - 151, issueBinaryIndex);
      arr.unshift(...beforeArr);
    } else {
      const beforeArr = binaryInfo.slice(0, issueBinaryIndex);
      arr.unshift(...beforeArr);
    }

    if (binaryInfo.length - 150 > issueBinaryIndex) {
      const afterARr = binaryInfo.slice(issueBinaryIndex, issueBinaryIndex + 150);
      arr.push(...afterARr);
    } else {
      const afterARr = binaryInfo.slice(issueBinaryIndex, binaryInfo.length);
      arr.push(...afterARr);
    }
    return arr;

  }

  sortBinaryDataId(a, b) {
    const aid = a[0];
    const bid = b[0];
    // 拆分字符串为数字部分和字符部分
    const [aNum, aChar] = aid.split('_');
    const [bNum, bChar] = bid.split('_');

    // 先比较数字部分，数字小的排在前面
    if (parseInt(aNum) !== parseInt(bNum)) {
      return parseInt(aNum) - parseInt(bNum);
    } else {
      // 如果数字部分相同，则比较字符部分，字符小的排在前面
      return parseInt(aChar) - parseInt(bChar);
    }
  }

  findDataIndex(time, data, index) {

    if (data[index].timestamp > time && data[index].timestamp / 1000000000 - time / 1000000000 > 0.01) {
      this.nextClipStartIndex = index;
    } else {
      this.findDataIndex(time, data, index + 1);
    }
  }
  loadSimulationWorld(index, type = 1) {
    if (type > 1) {
      // 上下帧、跳转播放
      console.log('------------------------type');
      STORE.playback.currentLoadingId = index;
      STORE.playback.cacheDataCurIndex = index + 5;
    }
    if (type === 3) {
      this.cancelTokenSource && this.cancelTokenSource.cancel('Request canceled by the user.');
    }
    // console.log(`loadSimulationWorld idnex: ${index}, currentLoadingId: ${STORE.playback.currentLoadingId}`);
    if (index === STORE.playback.currentLoadingId || type > 1) {

      return new Promise(resolve => {
        if (window.cacheData[index]) {
          setTimeout(() => {
            const message = SimWorldMessage.toObject(
              SimWorldMessage.decode(new Uint8Array(window.cacheData[index])),
              { enums: String },
            );
            STORE.playback.setDreamviewData(message.simulationWorldToSend[0]);

            const currentLoadingId = STORE.playback.currentLoadingId;
            if (this.binaryInfo[currentLoadingId] && this.binaryInfo[currentLoadingId][0]) {
              STORE.meters.updateCurBin(this.binaryInfo[currentLoadingId][0]);
            }
            let nexId = currentLoadingId + 1;
            if (nexId === this.binaryInfo.length) {
              nexId = 0;
            }
            STORE.playback.currentLoadingId =  nexId;
            STORE.playback.cacheDataCurIndex = nexId;
            resolve();
          }, 20);

        } else {
          const el = this.binaryInfo[index];
          if (!el || !el[2]) {return;}
          const path = this.getS3Path(el[2]);
          this.cancelTokenSource = axios.CancelToken.source();
          axios.get(path, { responseType: 'arraybuffer', cancelToken: this.cancelTokenSource.token })
            .then(res => {
              const message = SimWorldMessage.toObject(
                SimWorldMessage.decode(new Uint8Array(res.data)),
                { enums: String },
              );
              STORE.playback.setDreamviewData(message.simulationWorldToSend[0]);

              const issueKey = getUrlParam('issueKey');
              const cache = getUrlParam('cache');
              if (issueKey || cache) {
                const frameIndex = this.findFrameIndex(message.id);
                window.cacheData[frameIndex] = res.data;
              }

              this.setControlBarInfoIsLoaded(message.id, index);
              const oldCameraLen = STORE.playback.cameraChannel.length;
              const camera_data = message.simulationWorldToSend[0]?.cameraData || {};
              if (camera_data && JSON.stringify(camera_data) !== '{}' && Object.keys(camera_data).length > oldCameraLen) {
                STORE.playback.setCameraChannel(message.simulationWorldToSend[0]['cameraData']);
              }

              console.log(message.id, this.binaryInfo[STORE.playback.currentLoadingId][0]);
              console.log(`type: ${type}`);
              if (message.id !== this.binaryInfo[STORE.playback.currentLoadingId][0] && type !== 2) {
                return;
              }

              const currentLoadingId = STORE.playback.currentLoadingId;
              if (this.binaryInfo[currentLoadingId] && this.binaryInfo[currentLoadingId][0]) {
                STORE.meters.updateCurBin(this.binaryInfo[currentLoadingId][0]);
              }
              let nexId = currentLoadingId + 1;
              if (nexId === this.binaryInfo.length) {
                nexId = 0;
              }
              console.log(`success: ${nexId}-${message.id}`);
              STORE.playback.currentLoadingId =  nexId;
              STORE.playback.cacheDataCurIndex = nexId;
              resolve();
            })
            .catch(err => {
              if (axios.isCancel(err)) {
                console.error('Request canceled', err.message);
              } else {
              }
            });

        }
      });
    }
  }

  PreloadSimulationWorld(index) {
    return new Promise(resolve => {
      if (!window.cacheData[index]) {
        const el = this.binaryInfo[index];
        if (!el || !el[2]) {return;}
        const path = this.getS3Path(el[2]);
        axios.get(path, { responseType: 'arraybuffer' })
          .then(res => {
            const message = SimWorldMessage.toObject(
              SimWorldMessage.decode(new Uint8Array(res.data)),
              { enums: String },
            );

            // const issueKey = getUrlParam('issueKey');
            // const cache = getUrlParam('cache');
            // if (issueKey || cache) {
            //   const frameIndex = this.findFrameIndex(message.id);
            //   window.cacheData[frameIndex] = res.data;
            // }
            const frameIndex = this.findFrameIndex(message.id);
            window.cacheData[frameIndex] = res.data;

            this.setControlBarInfoIsLoaded(message.id, index);
            const oldCameraLen = STORE.playback.cameraChannel.length;
            const camera_data = message.simulationWorldToSend[0]?.cameraData || {};
            if (camera_data && JSON.stringify(camera_data) !== '{}' && Object.keys(camera_data).length > oldCameraLen) {
              STORE.playback.setCameraChannel(message.simulationWorldToSend[0]['cameraData']);
            }
            resolve();
          });
      }
    });

  }

  BuildPreloadBinaryPromise(path, index) {
    return new Promise((resolve, reject) => {
      if (window.cacheData[index]) {
        resolve();
      }
      axios.get(path, { responseType: 'arraybuffer' })
        .then(res => {
          const message = SimWorldMessage.toObject(
            SimWorldMessage.decode(new Uint8Array(res.data)),
            { enums: String },
          );
          const frameIndex = this.findFrameIndex(message.id);
          window.cacheData[frameIndex] = res.data;
          this.setControlBarInfoIsLoaded(message.id, index);
          const oldCameraLen = STORE.playback.cameraChannel.length;
          const camera_data = message.simulationWorldToSend[0]?.cameraData || {};
          if (camera_data && JSON.stringify(camera_data) !== '{}' && Object.keys(camera_data).length > oldCameraLen) {
            STORE.playback.setCameraChannel(message.simulationWorldToSend[0]['cameraData']);
          }
          resolve();
        })
        .catch(error => {
          reject();
        });
    });
  }

  findFrameIndex(id) {
    for (let index = 0; index < this.binaryInfo.length; index++) {
      const element = this.binaryInfo[index];
      if (element[0] === id) {
        return index;
      }
    }
  }

  setControlBarInfoIsLoaded(id, index) {
    const controlBarInfo = STORE.playback.controlBarInfo;
    controlBarInfo.forEach(item => {
      if (item.id === id) {
        item.isLoaded = true;
        item.index = index;
      }
    });
    STORE.playback.setControlBarInfo(controlBarInfo);
  }



  setMessageData(message) {
    const messageSize = JSON.stringify(message).length;
    // console.log('websocketRealtime messageSize = ', messageSize);
    this.dataSize += messageSize;
    STORE.meters.updateRealtimeStamp(Date.now());
    switch (message.type) {
      case 'setBinaryInfo':
        const timesInfo = message.data;
        this.binaryInfo = timesInfo;
        console.log(timesInfo.length - 1, timesInfo[timesInfo.length - 1]);
        STORE.playback.totalTimeS = timesInfo[timesInfo.length - 1][1] / 1e9 - timesInfo[0][1] / 1e9;
        const controlBarInfo = timesInfo.map((item, index) => {
          return {
            id: item[0],
            timestamp: item[1],
            isLoaded: false
          };
        });
        STORE.playback.setControlBarInfo(controlBarInfo);

        const params = this.parseQueryString(window.location.search);
        const { issueKey, eventTime, source } = params;
        if (issueKey || eventTime) {
          if (source === 'sim') {
            let issueBinaryIndex = 0;
            for (let i = 0; i < timesInfo.length; i++) {
              const el = timesInfo[i];
              if (el[1] >= eventTime * 1e9) {
                issueBinaryIndex = i - 5;
                break;
              }
            }
            STORE.playback.cacheDataCurIndex = issueBinaryIndex ? issueBinaryIndex : 0;
            STORE.playback.currentLoadingId = issueBinaryIndex ? issueBinaryIndex : 0;
          } else {
            const middleIndex = Math.floor(timesInfo.length / 2);
            STORE.playback.cacheDataCurIndex = middleIndex - 80 > -1 ? middleIndex - 80 : 0;
            STORE.playback.currentLoadingId = middleIndex - 80 > -1 ? middleIndex - 80 : 0;
          }
        }
        console.log(controlBarInfo.length);
        const binLen = controlBarInfo.length;
        if (binLen < 301 * 3) {
          this.createPreloadCacheTimer();
        }
        setTimeout(() => {
          this.createCacheTimer();
          STORE.playback.setIsDataReady();
          STORE.playback.setPlayRecordStatus('RUNNING');
          STORE.setInitializationStatus(true);
        }, 1000);

        break;
        // const chunkBinary = this.splitBinaryInfo(timesInfo);
        // for (let i = 0; i < chunkBinary.length; i++) {
        //   const requests = [];
        //   const subArray = chunkBinary[i];
        //   for (let j = 0; j < subArray.length; j++) {
        //     if (i > 0) {
        //       await this.sleep(30);
        //     }
        //     const el = subArray[j];
        //     if (!el || !el[2]) {return;}
        //     const freamIndex = this.findFrameIndex(el[0]);
        //     const  path = this.getS3Path(el[2]);
        //     requests.push(this.BuildPreloadBinaryPromise(path, freamIndex));
        //   }
        //   if (i === 0) {
        //     await Promise.allSettled(requests);
        //     // 在所有请求完成后执行特定操作
        //     STORE.playback.setIsDataReady();
        //     STORE.playback.setPlayRecordStatus('RUNNING');
        //     STORE.setInitializationStatus(true);
        //   }
        // }
      case 'SimWorldUpdate':
        this.checkMessage();


        const isNewMode = (this.currentMode
          && this.currentMode !== STORE.hmi.currentMode);
        const isNavigationModeInvolved = (this.currentMode === 'Navigation'
          || STORE.hmi.currentMode === 'Navigation');
        this.currentMode = STORE.hmi.currentMode;
        if (STORE.hmi.shouldDisplayNavigationMap) {
          if (MAP_NAVIGATOR.isInitialized()) {
            MAP_NAVIGATOR.update(message);
          }

          if (STORE.hmi.inNavigationMode) {
            // In navigation mode, the coordinate system is FLU and
            // relative position of the ego-car is (0, 0). But,
            // absolute position of the ego-car is needed in MAP_NAVIGATOR.
            message.autoDrivingCar.positionX = 0;
            message.autoDrivingCar.positionY = 0;
            message.autoDrivingCar.heading = 0;

            RENDERER.coordinates.setSystem('FLU');
            this.mapUpdatePeriodMs = 100;
          }
        } else {
          RENDERER.coordinates.setSystem('ENU');
          this.mapUpdatePeriodMs = 1000;
        }
        STORE.update(message, isNewMode);
        RENDERER.maybeInitializeOffest(
          message.autoDrivingCar.positionX,
          message.autoDrivingCar.positionY,
          // Updating offset only if navigation mode is involved since
          // its coordination system is different from rest of the modes.
          isNewMode && isNavigationModeInvolved,
        );
        if (!this.isDrawCarHistory) {
          this.getCarHistoryLocalization();
          this.isDrawCarHistory = true;
        }
        if (!this.isGetHistory) {
          this.getHistory();
          this.isGetHistory = true;
        }
        RENDERER.updateWorld(message);
        WS.updateMapIndex(message);
        if (this.routingTime !== message.routingTime) {
          // A new routing needs to be fetched from backend.
          WS.requestRoutePath();
          this.routingTime = message.routingTime;
        }
        break;
    }
  }
  splitBinaryInfo(inputArray) {
    const issueTime =  getUrlParam('eventTime');
    // 假设你有一个名为 inputArray 的数组
    if (issueTime) {

      // 找到中间长度为80的部分
      const size = 30;
      const middleIndex = Math.floor(inputArray.length / 2);
      const middlePart = inputArray.slice(middleIndex - size, middleIndex + size);
      STORE.playback.cacheDataCurIndex = middleIndex - size;


      // 将数组分成前后两部分
      const beforeMiddlePart = inputArray.slice(0, middleIndex - size);
      const afterMiddlePart = inputArray.slice(middleIndex + size);

      // 对剩余的部分进行发散排序
      const remainingPart = beforeMiddlePart.concat(afterMiddlePart).sort((a, b) => {
        return Math.abs(middleIndex - inputArray.indexOf(a)) - Math.abs(middleIndex - inputArray.indexOf(b));
      });

      // 平均分成4份
      const chunkSize = Math.ceil(remainingPart.length / 4);
      const remainingChunks = [];
      for (let i = 0; i < remainingPart.length; i += chunkSize) {
        remainingChunks.push(remainingPart.slice(i, i + chunkSize));
      }

      // 将分好的部分存储到一个大数组中
      const finalArray = [];
      finalArray.push(middlePart, ...remainingChunks);

      return finalArray;
    } else {
      const beforeMiddlePart = inputArray.slice(0, 60);
      const afterMiddlePart = inputArray.slice(60);
      const finalArray = [];
      finalArray.push(beforeMiddlePart, afterMiddlePart);
      return finalArray;
    }

  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  getS3Path(path) {
    if (path.indexOf('http') > -1) {
      return path;
    }
    const arr = path.split('/');
    const lastFourItems = arr.slice(-5);
    const lastPath = lastFourItems.join('/').replace('/simulation_world_binary', '');
    return 'http://10.199.2.100:8082/TenantAI:datahub/simulation_world_binary/' + lastPath;
  }

  createCacheTimer() {
    clearInterval(this.dreamviewTimer);
    this.dreamviewTimer = setInterval(() => {
      this.isLoading = true;
      const { cacheDataCurIndex, playRecordStatus } = STORE.playback;
      if (playRecordStatus !== 'RUNNING') {
        return;
      }
      // console.log(`timer-cacheDataCurIndex: ${cacheDataCurIndex}, ${STORE.playback.currentLoadingId}`);
      this.loadSimulationWorld(cacheDataCurIndex);
      if (cacheDataCurIndex === this.binaryInfo.length - 1) {
        STORE.playback.cacheDataCurIndex = 0;

      } else {
        STORE.playback.cacheDataCurIndex = cacheDataCurIndex + 1;
      }
    }, STORE.playback.msPerFrame);
  }

  getHistory() {
    const el = this.binaryInfo[0];
    const el2 = this.binaryInfo.find(item => item[0]?.split('_')[0] !== el[0]?.split('_')[0]);
    const path = this.getS3Path(el[2]);
    const path2 = el2 ? this.getS3Path(el2[2]) : '';
    const request = [];
    if (path) {
      request.push(this.reqHisttory(path));
    }
    if (path2) {
      request.push(this.reqHisttory(path2));
    }

    const mergedObj = {};
    Promise.all(request)
      .then(datas => {
        datas.forEach(data => {
          const message = HistoryMsg.toObject(
            HistoryMsg.decode(new Uint8Array(data)),
            { enums: String },
          );
          for (const key in message) {
            if (mergedObj.hasOwnProperty(key)) {
              mergedObj[key] = { ...mergedObj[key], ...message[key] };
            } else {
              mergedObj[key] = message[key];
            }
          }
        });
        STORE.meters.saveHistoryData(mergedObj);
      })
      .catch(error => {
        console.log(error);
      });
  }

  reqHisttory(path) {
    const url = path.replace(/(\d+)\.bin$/, 'history.bin');
    return new Promise((resolve, reject) => {
      axios.get(url, { responseType: 'arraybuffer' })
        .then(res => {
          resolve(res.data);
        })
        .catch(() => {
          reject();
        });
    });
  }

  getCarHistoryLocalization() {
    const el = this.binaryInfo[0];
    const el2 = this.binaryInfo.find(item => item[0]?.split('_')[0] !== el[0]?.split('_')[0]);
    const path = this.getS3Path(el[2]);
    const path2 = el2 ? this.getS3Path(el2[2]) : '';
    const request = [];
    if (path) {
      request.push(this.reqCarHisttory(path));
    }
    if (path2) {
      request.push(this.reqCarHisttory(path2));
    }

    let carPose = [];
    Promise.all(request)
      .then(datas => {
        console.log(datas);
        datas.forEach(data => {
          const message = HistoryLocalizationMsg.toObject(
            HistoryLocalizationMsg.decode(new Uint8Array(data)),
            { enums: String },
          );
          const carPoseList = message?.carCoordinate?.carPose || [];
          carPose = carPose.concat(carPoseList);

        });
        RENDERER.drawCarHistoryLocal(carPose);
      })
      .catch(error => {
        console.log(error);
      });
  }

  reqCarHisttory(path) {
    const url = path.replace(/(\d+)\.bin$/, 'history_localization.bin');
    return new Promise((resolve, reject) => {
      axios.get(url, { responseType: 'arraybuffer' })
        .then(res => {
          resolve(res.data);
        })
        .catch(() => {
          reject();
        });
    });
  }

  createPreloadCacheTimer() {
    clearInterval(this.preloaddreamviewTimer);
    this.preloaddreamviewTimer = setInterval(() => {
      const { cacheDataCurIndex } = STORE.playback;
      const controlBarInfo = STORE.playback.controlBarInfo;
      const nextIds = [];
      for (let i = 0; i < controlBarInfo.length; i++) {
        const el = controlBarInfo[i];
        if (i > cacheDataCurIndex && !el.isLoaded && nextIds.length <= 2 && this.preloadIds.indexOf(i) < 0) {
          nextIds.push(i);
        }
        if (nextIds.length >= 2) {
          break;
        }
      }
      nextIds.map(i => {
        this.preloadIds.push(i);
        this.PreloadSimulationWorld(i);
      });
      if (nextIds.length === 0) {
        for (let i = 0; i < controlBarInfo.length; i++) {
          const el = controlBarInfo[i];
          if (!el.isLoaded && nextIds.length <= 2 && this.preloadIds.indexOf(i) < 0) {
            nextIds.push(i);
          }
          if (nextIds.length >= 2) {
            break;
          }
        }
        nextIds.map(i => {
          this.preloadIds.push(i);
          this.PreloadSimulationWorld(i);
        });
      }
      const notLoaded = controlBarInfo.filter(item => !item.isLoaded);
      if (notLoaded.length < 1) {
        console.log('终止预请求定时器');
        clearInterval(this.preloaddreamviewTimer);
      }
    }, 50);
  }

  checkMessage(world) {
    const now = new Date().getTime();
    const duration = now - this.simWorldLastUpdateTimestamp;
    if (this.simWorldLastUpdateTimestamp !== 0 && duration > 200) {
      console.warn(`Last sim_world_update took ${duration}ms`);
    }
    this.simWorldLastUpdateTimestamp = now;
  }

  updateMapIndex(message) {
    const now = new Date();
    const duration = now - this.mapLastUpdateTimestamp;
    if (message.mapHash && duration >= this.mapUpdatePeriodMs) {
      RENDERER.updateMapIndex(message.mapHash, message.mapElementIds, message.mapRadius);
      this.mapLastUpdateTimestamp = now;
    }
  }

  requestRoutePath() {
    this.websocket.send(JSON.stringify({
      type: 'RequestRoutePath',
    }));
  }

  parseQueryString(queryString) {
    const params = {};

    queryString.replace('?', '').split('&').forEach((query) => {
      const segments = query.split('=');
      params[segments[0]] = segments[1];
    });
    return params;
  }
}