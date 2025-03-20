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
      maxProbability: false,
      obsId: ''
    };
  }
  componentDidMount() {
    this.setState({
      maxProbability: true,
    });
  }
  inputValue = e => {
    STORE.meters.updateEffLaneIndex(e.target.value);
  };

  inputObsIdValue = e => {
    const value = e.target.value;
    this.setState({obsId: value});
  };

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

    const { selectEfficientLaneSequence } = this.props.store.meters;
    const nnpathSpeed =  [];
    const nnpathSpeedAdd = [];
    const nnpathSpeedSub = [];
    if (selectEfficientLaneSequence?.vtProfilePoint) {
      const vtProfilePoint = toJS(selectEfficientLaneSequence?.vtProfilePoint);
      for (let j = 0; j < vtProfilePoint.length;j++) {
        nnpathSpeed.push({ x: roundNumber(vtProfilePoint[j].t, 1), y: vtProfilePoint[j].v });
        nnpathSpeedAdd.push({ x: roundNumber(vtProfilePoint[j].t, 1), y: vtProfilePoint[j].v + vtProfilePoint[j].var});
        nnpathSpeedSub.push({ x: roundNumber(vtProfilePoint[j].t, 1), y: vtProfilePoint[j].v - vtProfilePoint[j].var });
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
    const { selectEfficientLaneSequence, postTbtInfos, postGoalInfos, efficientLaneSequenceMaxIndex } = this.props.store.meters;
    let treeDataDecision = null;
    if (selectEfficientLaneSequence?.decisionRetPair) {
      let data = toJS(selectEfficientLaneSequence?.decisionRetPair);
      data = data.sort((a, b) => a.obsId - b.obsId);
      if (this.state.obsId) {
        data = data.filter(item => item.obsId === parseInt(this.state.obsId));
      }
      treeDataDecision = [{title: 'decision_ret_pair', children: convertToTreeData(data)}];
    }
    let treeDataCurb = null;
    if (selectEfficientLaneSequence?.curbDecisionPair) {
      let data = toJS(selectEfficientLaneSequence.curbDecisionPair);
      if (this.state.obsId) {
        data = data.filter(item => item.obsId === parseInt(this.state.obsId));
      }
      treeDataCurb = [{title: 'curb_decision_pair', children: convertToTreeData(toJS(data))}];
    }
    let egoPathPoint = null;
    if (selectEfficientLaneSequence?.egoPathPoint) {
      const data = toJS(selectEfficientLaneSequence.egoPathPoint);
      egoPathPoint = [{title: 'ego_path_point', children: convertToTreeData(toJS(data))}];
    }
    let vtProfilePoint = null;
    if (selectEfficientLaneSequence?.vtProfilePoint) {
      const data = toJS(selectEfficientLaneSequence.vtProfilePoint);
      vtProfilePoint = [{title: 'vt_profile_point', children: convertToTreeData(toJS(data))}];
    }
    let treePostTbtInfos = null;
    if (postTbtInfos) {
      treePostTbtInfos = [{title: 'post_tbt_infos', children: convertToTreeData(toJS(postTbtInfos))}];
    }
    let treePostGoalInfos = null;
    if (postGoalInfos) {
      treePostGoalInfos = [{title: 'post_goal_infos', children: convertToTreeData(toJS(postGoalInfos))}];
    }
    return (
      <div className="monitor prediction-monitor">
        <div>
          {this.handleChart()}
        </div>
        <div className="top">
        <input
          placeholder="index"
          type="number"
          disabled={this.state.maxProbability}
          className="eff-monitor-input"
          maxLength={5}
          onChange={this.inputValue}
        />
        <input
          placeholder="obsId"
          type="number"
          className="eff-monitor-input"
          maxLength={5}
          value={this.state.obsId}
          onChange={this.inputObsIdValue}
        />
        <CheckboxItem
            title="Max probability"
            disabled={false}
            extraClasses="others-checkbox"
            isChecked={this.state.maxProbability}
            onClick={() => {
              STORE.meters.updateEffLaneMax(!this.state.maxProbability);
              this.setState({
                maxProbability: !this.state.maxProbability
              });
            }}
        />
        </div>
        <CheckboxItem
            title="Single path"
            disabled={false}
            extraClasses="others-checkbox"
            isChecked={STORE.meters.effLaneSinglePath}
            onClick={() => {
              STORE.meters.updateEffLaneSinglePath(!STORE.meters.effLaneSinglePath);
            }}
        />
        {selectEfficientLaneSequence && <div style={{color: '#fff', margin: '0 0 5px 8px'}}>
          probability: {selectEfficientLaneSequence.probability}
          {this.state.maxProbability && <span style={{marginLeft: '12px'}}>
            index: {efficientLaneSequenceMaxIndex}
          </span>}
        </div>}
        {treeDataDecision && <Tree
          defaultExpandAll={false}
          treeData={treeDataDecision}
        />}
        {treeDataCurb && <Tree
          defaultExpandAll={false}
          treeData={treeDataCurb}
        />}
        {egoPathPoint && <Tree
          defaultExpandAll={false}
          treeData={egoPathPoint}
        />}
        {vtProfilePoint && <Tree
          defaultExpandAll={false}
          treeData={vtProfilePoint}
        />}
        {treePostTbtInfos && <Tree
          defaultExpandAll={false}
          treeData={treePostTbtInfos}
        />}
        {treePostGoalInfos && <Tree
          defaultExpandAll={false}
          treeData={treePostGoalInfos}
        />}
      </div>
    );
  };
}
