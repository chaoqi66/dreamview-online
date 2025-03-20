import React from 'react';
import { inject, observer } from 'mobx-react';
import Loadable from 'react-loadable';

import EmergencyNotification from 'components/common/EmergencyNotification';
import Loader from 'components/common/Loader';
import PlaybackControls from 'components/PlaybackControls';
import RouteEditingBar from 'components/RouteEditingBar';
import Scene from 'components/Scene';
import StatusBar from 'components/StatusBar';
import ToolView from 'components/Layouts/ToolView';

const Navigation = Loadable({
  loader: () => import('components/Navigation'),
  loading() {
    return <div className="navigation-view">Loading...</div>;
  },
});

@inject('store') @observer
class SceneView extends React.Component {
  render() {
    const {
      dimension, meters, monitor,
      hmi, options, trafficSignal, virtualCar
    } = this.props.store;

    return (
            <React.Fragment>
                <Scene
                    width={dimension.scene.width}
                    height={dimension.scene.height}
                    options={options}
                    shouldDisplayOnRight={dimension.shouldDivideSceneAndMapSpace}
                />
                {/* {monitor.isSirenOn &&
                  <EmergencyNotification msg="Emergency Siren Detected" />} */}
                {options.showRouteEditingBar
                  ? <RouteEditingBar />
                  : (
                        <StatusBar
                            meters={meters}
                            virtualCar={virtualCar.virtualCar}
                            trafficSignal={trafficSignal}
                            showTimestamp={options.showTimestamp}
                            showMessageSize={options.showMessageSize}
                            showDeltaTime={options.showDeltaTime}
                            showTimeInterval={options.showTimeInterval}
                            showNotification={!options.showTasks}
                            showPlanningRSSInfo={options.showPlanningRSSInfo}
                            showPNCMonitor={options.showPNCMonitor}
                            showSpeedAcc={options.showSpeedAcc}
                            selectPNCMonitorTab={options.selectPNCMonitorTab}
                            showPNCPlanningPanel={options.showPNCPlanningPanel}
                            showPNCControlPanel={options.showPNCControlPanel}
                            showPlanningStatusPanel={options.showPlanningStatusPanel}
                            showControlPanel={options.showControlPanel}
                            showVirtualChassis={options.showVirtualChassis}
                            monitor={monitor}
                        />
                  )}
                {OFFLINE_PLAYBACK && <PlaybackControls />}
                {hmi.shouldDisplayNavigationMap
                    && (
                        <Navigation
                            onResize={() => dimension.toggleNavigationSize()}
                            hasRoutingControls={hmi.inNavigationMode}
                            {...dimension.navigation}
                        />
                    )}
            </React.Fragment>
    );
  }
}

@inject('store') @observer
export default class MainView extends React.Component {
  render() {
    const { isInitialized, dimension } = this.props.store;

    const height = dimension.main.height;
    return (
            <div className="main-view" style={{ height }}>
                {(!isInitialized && !OFFLINE_PLAYBACK) ? <Loader /> : <SceneView />}
                <ToolView />
            </div>
    );
  }
}
