import React from 'react';
import { Tree } from 'antd';
import STORE from 'store';
import { convertToTreeData, roundNumber } from 'utils/misc';
import { toJS } from 'mobx';
import CheckboxItem from 'components/common/CheckboxItem';
import { inject, observer } from 'mobx-react';
import SETTING from 'store/config/PlanningGraph.yml';
import ScatterGraph, { generateScatterGraph } from 'components/PNCMonitor/ScatterGraph';

@inject('store') @observer
export default class EfficientLaneMonitor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }
  componentDidMount() {

  }


  handleChart = () => {
    const setting = SETTING['nnpathVt'];
    const autoDrivingCar = this.props.store.autoDrivingCar.autoDrivingCar;
    const autoDrivingCarList = [];
    if (autoDrivingCar) {
      const acceleration = autoDrivingCar.acceleration || 0;
      const speed = autoDrivingCar.speed || 0;
      let perceptioSpeed = speed;
      for (let i = 0; i < 6; i++) {
        autoDrivingCarList.push({ x: i, y: perceptioSpeed });
        perceptioSpeed = perceptioSpeed + acceleration;
      }
    }

    const { selectEgoPathProposal } = this.props.store.meters;
    const nnpathSpeed =  [];
    const nnpathSpeedAdd = [];
    const nnpathSpeedSub = [];
    if (selectEgoPathProposal?.vtProfilePoints) {
      const vtProfilePoints = toJS(selectEgoPathProposal?.vtProfilePoints);
      for (let j = 0; j < vtProfilePoints.length;j++) {
        nnpathSpeed.push({ x: roundNumber(vtProfilePoints[j].t, 1), y: vtProfilePoints[j].v });
        nnpathSpeedAdd.push({ x: roundNumber(vtProfilePoints[j].t, 1), y: vtProfilePoints[j].v + vtProfilePoints[j].var});
        nnpathSpeedSub.push({ x: roundNumber(vtProfilePoints[j].t, 1), y: vtProfilePoints[j].v - vtProfilePoints[j].var });
      }
    }
    return (
      <ScatterGraph
        options={setting.options}
        properties={setting.properties}
        data={{ lines: { VehicleSpeed: autoDrivingCarList, NnpathSpeed: nnpathSpeed, NnpathSpeedAdd: nnpathSpeedAdd, NnpathSpeedSub: nnpathSpeedSub } }}
        isShow={true}
      />
    );
  };

  render() {
    const { selectEgoPathProposalIndex } = this.props.store.meters;
    return (
      <div className="monitor prediction-monitor">
        <div className="ego-propsales-top">index: {selectEgoPathProposalIndex || 0}</div>
        <div>
          {this.handleChart()}
        </div>
      </div>
    );
  };
}
