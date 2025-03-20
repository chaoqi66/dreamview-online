import React from 'react';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';

import CheckboxItem from 'components/common/CheckboxItem';
import SETTING from 'store/config/PlanningGraph.yml';
import ScatterGraph, { generateScatterGraph } from 'components/PNCMonitor/ScatterGraph';
import PlanningScenarioTable from 'components/PNCMonitor/PlanningScenarioTable';
import PlanningObstacleId from 'components/PNCMonitor/PlanningObstacleId';

@inject('store') @observer
export default class PlanningMonitor extends React.Component {
  generateGraphsFromDatasets(settingName, datasets) {
    const { options } = this.props.store;
    const setting = SETTING[settingName];
    if (!setting) {
      console.error('No such setting name found in PlanningGraph.yml:', settingName);
      return null;
    }

    return _.get(setting, 'datasets', []).map(({ name, graphTitle, isShow }) => {
      const graph = datasets[name];
      const polygons = graph ? graph.obstaclesBoundary : [];
      // console.log('name = ', name);
      // console.log('graphTitle = ', graphTitle);
      // console.log('settingName = ', settingName);
      // console.log('datasets = ', datasets);
      // console.log('setting = ', setting);
      // console.log('graph = ', graph);
      // console.log('polygons = ', polygons);

      return (
                <ScatterGraph
                    key={`${settingName}_${name}`}
                    title={graphTitle}
                    options={setting.options}
                    properties={setting.properties}
                    data={{ lines: graph, polygons }}
                    isShow={options[isShow]}
                />
      );
    });
  }

  render() {
    const { options } = this.props.store;
    const {
      planningTimeSec, data, chartData, scenarioHistory,
    } = this.props.store.planningData;
    const nnPathChart = [];
    const othersChart = [];
    chartData.forEach(item => {
      if (['NN Path Diff', 'NN path S-L'].includes(item.title)) {
        nnPathChart.push(item);
      } else {
        othersChart.push(item);
      }
    });

    if (!planningTimeSec) {
      return null;
    }

    const chartCount = {};

    const checkboxList = [
      {
        id: 'showPNCPlanningPanel',
        title: 'Planning 控制面板'
      },
      {
        id: 'showPNCPlanningCore',
        title: 'Core Point'
      },
      {
        id: 'showPNCPlanningBoundary',
        title: 'Boundary Point'
      },
      {
        id: 'showPNCPlanningBuffer',
        title: 'Buffer Point'
      },
      // {
      //   id: 'showPlanningStatusPanel',
      //   title: 'Planning Status'
      // },
    ];

    return (
            <div className='planning-data'>
              <div>
                {
                  checkboxList.map((item) => {
                    return (
                      <CheckboxItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        isChecked={options[item.id]}
                        disabled={false}
                        onClick={() => {
                          this.props.store.handleOptionToggle(item.id);
                        }}
                      />
                    );
                  })
                }
              </div>
                <PlanningObstacleId />

                <PlanningScenarioTable scenarios={scenarioHistory} />
                {nnPathChart.map((chart) => {
                  // Adding count to chart key to prevent duplicate chart title
                  if (!chartCount[chart.title]) {
                    chartCount[chart.title] = 1;
                  } else {
                    chartCount[chart.title] += 1;
                  }

                  return (
                        <ScatterGraph
                            key={`custom_${chart.title}_${chartCount[chart.title]}`}
                            title={chart.title}
                            options={chart.options}
                            properties={chart.properties}
                            data={chart.data}
                        />
                  );
                })}
                {this.generateGraphsFromDatasets('stGraph', data.stGraph)}
                {this.generateGraphsFromDatasets('speedLimitRef', data.speedLimitRef)}
                {this.generateGraphsFromDatasets('debugStGraph', data.debugStGraph)}
                {/* {this.generateGraphsFromDatasets('stSpeedGraph', data.stSpeedGraph)} */}
                {othersChart.map((chart) => {
                  // Adding count to chart key to prevent duplicate chart title
                  if (!chartCount[chart.title]) {
                    chartCount[chart.title] = 1;
                  } else {
                    chartCount[chart.title] += 1;
                  }

                  return (
                        <ScatterGraph
                            key={`custom_${chart.title}_${chartCount[chart.title]}`}
                            title={chart.title}
                            options={chart.options}
                            properties={chart.properties}
                            data={chart.data}
                        />
                  );
                })}
                {generateScatterGraph(SETTING.speedGraph, data.speedGraph)}
                {generateScatterGraph(SETTING.accelerationGraph, data.accelerationGraph)}
                {generateScatterGraph(SETTING.planningThetaGraph, data.thetaGraph)}
                {generateScatterGraph(SETTING.planningKappaGraph, data.kappaGraph)}
                {generateScatterGraph(SETTING.planningDkappaGraph, data.dkappaGraph)}
                {generateScatterGraph(SETTING.referenceLineThetaGraph, data.thetaGraph)}
                {generateScatterGraph(SETTING.referenceLineKappaGraph, data.kappaGraph)}
                {generateScatterGraph(SETTING.referenceLineDkappaGraph, data.dkappaGraph)}
            </div>
    );
  }
}
