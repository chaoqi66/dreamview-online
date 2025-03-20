import React from 'react';
import { inject, observer } from 'mobx-react';

import CheckboxItem from 'components/common/CheckboxItem';
import WS, {CAMERA_WS} from 'store/websocket';

@inject('store') @observer
export default class Others extends React.Component {
  render() {
    const { options, enableHMIButtonsOnly, hmi } = this.props.store;

    const disablePanel = enableHMIButtonsOnly || options.lockTaskPanel;
    const hasPncMonitor = !hmi.inTeleopMode && !options.showCameraView;

    return (
            <div className="others card">
                <div className="card-header"><span>Others</span></div>
                <div className="card-content-column">
                    <button
                        className="command-button"
                        disabled={disablePanel}
                        onClick={() => {
                          WS.resetBackend();
                        }}
                    >
                        Reset Backend Data
                    </button>
                    <button
                        className="command-button"
                        disabled={disablePanel}
                        onClick={() => {
                          WS.dumpMessages();
                        }}
                    >
                        Dump Message
                    </button>
                    <CheckboxItem
                        id="panelLock"
                        title="Lock Task Panel"
                        isChecked={options.lockTaskPanel}
                        disabled={false}
                        extraClasses="others-checkbox"
                        onClick={() => {
                          this.props.store.handleOptionToggle('lockTaskPanel');
                        }}
                    />
                    {hasPncMonitor
                        && (
                            <CheckboxItem
                                id="showPNCMonitor"
                                title="PNC Monitor"
                                isChecked={options.showPNCMonitor}
                                disabled={disablePanel}
                                extraClasses="others-checkbox"
                                onClick={() => {
                                  this.props.store.handleOptionToggle('showPNCMonitor');
                                }}
                            />
                        )}
                    {<CheckboxItem
                      id="showPredictionMonitor"
                      title="Prediction Monitor"
                      isChecked={options.showPredictionMonitor}
                      disabled={disablePanel}
                      extraClasses="others-checkbox"
                      onClick={() => {
                        this.props.store.handleOptionToggle('showPredictionMonitor');
                      }}
                    />}
                    {<CheckboxItem
                      id="showEfficientLaneMonitor"
                      title="Efficient Lane Monitor"
                      isChecked={options.showEfficientLaneMonitor}
                      disabled={disablePanel}
                      extraClasses="others-checkbox"
                      onClick={() => {
                        this.props.store.handleOptionToggle('showEfficientLaneMonitor');
                      }}
                    />}
                    {<CheckboxItem
                      id="showRoadNetProposals"
                      title="Ego Proposals Monitor"
                      isChecked={options.showRoadNetProposals}
                      disabled={disablePanel}
                      extraClasses="others-checkbox"
                      onClick={() => {
                        this.props.store.handleOptionToggle('showRoadNetProposals');
                      }}
                    />}
                    {hmi.isCalibrationMode
                      && (
                            <CheckboxItem
                                id="showFuelClient"
                                title="Fuel Client"
                                isChecked={hmi.isSensorCalibrationMode ? options.showFuelClient
                                  : options.showDataCollectionMonitor}
                                disabled={disablePanel || !hmi.isCalibrationMode}
                                extraClasses="others-checkbox"
                                onClick={() => {
                                  const showParam = (hmi.isSensorCalibrationMode) ? 'showFuelClient' : 'showDataCollectionMonitor';
                                  this.props.store.handleOptionToggle(showParam);
                                }}
                            />
                      )}
                    {/* <CheckboxItem
                        id="toggleSimControl"
                        title="Sim Control"
                        isChecked={options.enableSimControl}
                        disabled={options.lockTaskPanel}
                        extraClasses="others-checkbox"
                        onClick={() => {
                          WS.toggleSimControl(!options.enableSimControl);
                          if (!options.enableSimControl) {
                            WS.getDymaticModelList();
                            WS.switchToDefaultDynamicModel();
                            this.props.store.setOptionStatus('showVirtualCloseLoop');
                            this.props.store.setOptionStatus('showCloseLoop');
                          }
                          this.props.store.handleOptionToggle('enableSimControl');
                        }}
                    /> */}
                    <CheckboxItem
                        id="showVirtualCloseLoop"
                        title="Planning Loop"
                        isChecked={options.showVirtualCloseLoop}
                        disabled={disablePanel}
                        extraClasses="others-checkbox"
                        onClick={() => {
                          // WS.toggleSimControl(!options.showVirtualCloseLoop);
                          // if (!options.showVirtualCloseLoop) {
                          //   console.log('WS = ', WS);
                          //   console.log('WS.switchToVirtualCloseLoopModel = ', WS.switchToVirtualCloseLoopModel);
                          //   WS.switchToVirtualCloseLoopModel();
                          //   this.props.store.setOptionStatus('enableSimControl');
                          //   this.props.store.setOptionStatus('showCloseLoop');
                          // }
                          this.props.store.handleOptionToggle('showVirtualCloseLoop');
                        }}
                    />
                    {/* <CheckboxItem
                        id="showCloseLoop"
                        title="Control Loop"
                        isChecked={options.showCloseLoop}
                        disabled={disablePanel}
                        extraClasses="others-checkbox"
                        onClick={() => {
                          WS.toggleSimControl(!options.showCloseLoop);
                          if (!options.showCloseLoop) {
                            console.log('WS = ', WS);
                            console.log('WS.switchToCloseLoopModel = ', WS.switchToCloseLoopModel);
                            WS.switchToCloseLoopModel();
                            this.props.store.setOptionStatus('enableSimControl');
                            this.props.store.setOptionStatus('showVirtualCloseLoop');
                          }
                          this.props.store.handleOptionToggle('showCloseLoop');
                        }}
                    /> */}
                    {/* <CheckboxItem
                        id="showVideo"
                        title="Camera Sensor"
                        isChecked={options.showVideo}
                        disabled={disablePanel}
                        extraClasses="others-checkbox"
                        onClick={() => {
                          this.props.store.handleOptionToggle('showVideo');
                          CAMERA_WS
                            .getCameraChannel().then((channels) => {
                              if (Array.isArray(channels) && channels.length > 0) {
                                if (hmi.currentCameraSensorChannel !== '') {
                                  // CAMERA_WS.changeCameraChannel(hmi.currentCameraSensorChannel)
                                  //   .startCamera();
                                }
                              } else {
                                alert('No camera channel found!');
                              }
                            });
                        }}
                    /> */}
                </div>
            </div>
    );
  }
}
