import React from 'react';

import Selector from 'components/Header/Selector';
import ScenarioSetSelector from 'components/Header/ScenarioSetSelector';
import WS from 'store/websocket';
import { inject, observer } from 'mobx-react';
import {
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  AudioOutlined
} from '@ant-design/icons';
import { reaction } from 'mobx';
import { copyTxt } from 'utils/misc';
import RENDERER from 'renderer/';
import { startGuide } from 'utils/driver';

@inject('store') @observer
export default class HMISelectors extends React.Component {

  componentDidMount() {
    this.dispose = reaction(
      () => this.props.store.meters.mapFile,
      (mapFile) => {
        mapFile && WS.changeMap(mapFile);
      }
    );
    // this.disposeMapMode = reaction(
    //   () => this.props.store.meters.mapMode,
    //   (mapMode) => {
    //     if (mapMode === 'hdmap') {
    //       this.props.store.options.setOption('showHighMap', true);
    //       this.props.store.options.setOption('showRoadStructure', false);
    //     }
    //     if (mapMode === 'mapless') {
    //       this.props.store.options.setOption('showHighMap', false);
    //       this.props.store.options.setOption('showRoadStructure', true);
    //       const parameters_url = localStorage.getItem('PARAMETERS_URL');
    //       const parameters_obj = parameters_url ? JSON.parse(parameters_url) : {
    //         label: 'default',
    //         value: 'parameters.json'
    //       };
    //       const currentConfig = parameters_obj.label || 'default';
    //       if (currentConfig === 'roadPerception') {
    //         this.props.store.options.setOption('showRoadStructure', false);
    //       }
    //     }
    //     const { useHdmap } = this.props.store.meters;
    //     const useHdmapCache = sessionStorage.getItem('useHdmap');
    //     if (useHdmapCache) {
    //       WS.changeHasMap(useHdmapCache);
    //       return;
    //     }
    //     mapMode && WS.changeHasMap(mapMode);
    //     if (useHdmap && mapMode && useHdmap !== mapMode) {
    //       // window.location.reload();
    //     }
    //   }
    // );
    this.disposeVirtualCar = reaction(
      () => this.props.store.virtualCar.virtualCar,
      (virtualCar) => {
        if (virtualCar) {
          this.props.store.options.setOption('showVirtualCloseLoop', true);
          this.props.store.options.setOption('showVirtualChassis', true);
        } else {
          this.props.store.options.setOption('showVirtualCloseLoop', false);
          this.props.store.options.setOption('showVirtualChassis', false);
        }
        // this.disposeVirtualCar();
      }
    );

    this.disposeMapfree = reaction(
      () => this.props.store.meters.lanemapMapfreeSwitchMode,
      (lanemapMapfreeSwitchMode) => {
        if (lanemapMapfreeSwitchMode === 'lanemap') {
          this.props.store.options.setOption('showRoadStructure', true);
          this.props.store.options.setOption('showRoadStructurePerception', false);
        }
        if (lanemapMapfreeSwitchMode === 'mapfree') {
          this.props.store.options.setOption('showRoadStructure', false);
          this.props.store.options.setOption('showRoadStructurePerception', true);
        }
      },
    );
    this.disposeMapfree = reaction(
      () => this.props.store.meters.faultReport,
      () => {
        if (this.props.store.meters.autoFaultReport && this.props.store.meters.faultReport.length) {
          this.props.store.options.setOption('showFaultReport', true);
        }
      },
    );
  }

  copyMapFile(filePath) {
    copyTxt(filePath);
  }

  handleStartGuide() {
    startGuide();
  }

  componentWillUnmount() {
    this.dispose();
    // this.disposeMapMode();
  }

  render() {

    const {
      dockerImage,
      modes, currentMode,
      maps, currentMap,
      vehicles, currentVehicle,
      isCoDriver,
      isMute,
    } = this.props.store.hmi;
    const { mapFile, useHdmap, mapMode } = this.props.store.meters;
    const enableSimControl = this.props.store.options.enableSimControl;

    const {
      scenarioSet,
      currentScenarioSetId,
      currentScenarioId
    } = this.props.store.studioConnector;

    const currentScenarioSet = scenarioSet.find(
      scenarioSetItem => scenarioSetItem.scenarioSetId === currentScenarioSetId
    ) || {};

    const configFiles = CONFIG_FILES.filter(file => file !== 'src/store/config/parameters.yml').map(file => {
      const filename = file.replaceAll('src/store/config/parameters_', '').replaceAll('.yml', '');
      return {
        label: filename,
        value: `parameters_${filename}.json`
      };
    });
    const defaultConfig = {
      label: 'default',
      value: 'parameters.json'
    };
    const configs = [
      defaultConfig,
      ...configFiles
    ];
    const parameters_url = localStorage.getItem('PARAMETERS_URL');
    const parameters_obj = parameters_url ? JSON.parse(parameters_url) : defaultConfig;
    const currentConfig = parameters_obj.label || 'default';

    return (
            <React.Fragment>
                {/* <Selector
                    name="setup mode"
                    options={modes}
                    currentOption={currentMode}
                    onChange={(event) => {
                      WS.changeSetupMode(event.target.value);
                    }}
                />
                <Selector
                    name="vehicle"
                    options={vehicles}
                    currentOption={currentVehicle}
                    onChange={(event) => {
                      WS.changeVehicle(event.target.value);
                    }}
                /> */}
                {/* {mapMode === 'hdmap' && <Selector
                    name=""
                    options={maps}
                    currentOption={mapFile ? mapFile : currentMap}
                    onChange={(event) => {
                      WS.changeMap(event.target.value);
                    }}
                />}
                {mapMode === 'mapless' && <div className="header-item selector">
                  <div className="mapless-name" title={mapFile || ''} onClick={() => this.copyMapFile(mapFile)}>
                    {mapFile}
                  </div>
                </div>} */}
                <Selector
                    name="config"
                    options={
                      configs.map(config => config.label)
                    }
                    currentOption={currentConfig}
                    onChange={(event) => {
                      const obj = configs.find(config => config.label === event.target.value) || defaultConfig;
                      localStorage.setItem('PARAMETERS_URL', JSON.stringify(obj));
                      sessionStorage.setItem('saveOptions', JSON.stringify(this.props.store.options));
                      window.initLoadJSON(true);
                      RENDERER.carHistoryLocal.updateCarHistoryMesh();
                    }}
                />
                <a id='dreamview-doc' title='说明文档' href='https://robosense.feishu.cn/docx/Qj0ed2tDloXvIixDfw9cXrxTnPc' target="_blank"><QuestionCircleOutlined className='dreamview-question' /></a>
                <a onClick={this.handleStartGuide} title="新人指引">
                  <ExclamationCircleOutlined  className='dreamview-guide'/>
                </a>
              {
                (enableSimControl
                  && currentScenarioSet.scenarios
                  && currentScenarioSet.scenarios.length > 0)
                && (
                  <ScenarioSetSelector
                    name='scenarioSet'
                    options={
                      currentScenarioSet
                        .scenarios
                        .map(scenario => ({
                          value: scenario.scenarioId,
                          label: scenario.scenarioName,
                        }))
                    }
                    currentOption={currentScenarioId || ''}
                    onChange={(event) => {
                      WS.changeScenario(event.target.value);
                    }}
                  />)
              }
            </React.Fragment>
    );
  }
}
