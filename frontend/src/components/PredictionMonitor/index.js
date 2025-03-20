import React from 'react';
import { Tree } from 'antd';
import STORE from 'store';
import { convertToTreeData } from 'utils/misc';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class PredictionMonitor extends React.Component {

  inputValue = e => {
    STORE.meters.updatePredictionObstacleId(e.target.value);
  };

  render() {
    const { predictionObstacle } = this.props.store.meters;
    let treeData = null;
    if (predictionObstacle && predictionObstacle.objectType !== 'TYPE_STATIC_UNKNOWN') {
      treeData = [{title: 'Prediction Monitor', children: convertToTreeData(toJS(predictionObstacle))}];
    }
    return (
      <div className="monitor prediction-monitor">
        <input
          placeholder="obstacle id"
          className="prediction-monitor-input"
          maxLength={5}
          onChange={this.inputValue}
        />
        {treeData && <Tree
          defaultExpandAll={true}
          treeData={treeData}
        />}

      </div>
    );
  };
}
