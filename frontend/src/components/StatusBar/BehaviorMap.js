import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';
import { toJS } from 'mobx';
import CheckboxItem from 'components/common/CheckboxItem';

@inject('store') @observer
export default class BehaviorMap extends React.Component {

  changeStart = e => {
    STORE.meters.updateMultiFrameLane(e.target.value, null);
  };

  onChange = (type, id, checked) => {
    const obj = {};
    obj[id] = !checked;
    STORE.meters.updateBehaviorMapSwitch(obj, type);
  };

  render() {
    const behaviorMap = toJS(STORE.meters.behaviorMap);
    const behaviorMapSwitch = toJS(STORE.meters.behaviorMapSwitch);
    const { lanePrefer = [], pathByLane = [], speedLimitByLane = [] } = behaviorMap;
    const { lanePreferSwitch, pathByLaneSwitch, speedLimitByLaneSwitch } = behaviorMapSwitch;
    return (
      <div className="behavior-map">
        <div className='title'>
          <div>version: {behaviorMap.version || ''}</div>
          <div>timestamp: {behaviorMap.timestamp || ''}</div>
        </div>
        {lanePrefer.map(item => {
          return <div className="switch-box">
                  <CheckboxItem
                      key={item.id}
                      id={item.id}
                      title={`lane prefer ${item.id}`}
                      isChecked={lanePreferSwitch[item.id] === true}
                      disabled={false}
                      onClick={() => {
                        this.onChange('0', item.id, lanePreferSwitch[item.id]);
                      }}
                    />
                </div>;
        })}
        {pathByLane.map(item => {
          return <div className="switch-box">
            <CheckboxItem
                key={item.id}
                id={item.id}
                title={`path by lane ${item.id}`}
                isChecked={pathByLaneSwitch[item.id] === true}
                disabled={false}
                onClick={() => {
                  this.onChange('1', item.id, pathByLaneSwitch[item.id]);
                }}
              />
          </div>;
        })}
        {speedLimitByLane.map(item => {
          return <div className="switch-box">
            <CheckboxItem
                key={item.id}
                id={item.id}
                title={`speed limit ${item.id}(${item.speedLimit})`}
                isChecked={speedLimitByLaneSwitch[item.id] === true}
                disabled={false}
                onClick={() => {
                  this.onChange('2', item.id, speedLimitByLaneSwitch[item.id]);
                }}
              />
          </div>;
        })}
      </div>
    );
  }
}