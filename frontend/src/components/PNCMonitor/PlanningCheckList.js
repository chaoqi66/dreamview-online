import React from 'react';
import { inject, observer } from 'mobx-react';

import CheckboxItem from 'components/common/CheckboxItem';

@inject('store') @observer
export default class PlanningCheckList extends React.Component {
  render() {
    const { options } = this.props.store;
    const checkboxList = [
      {
        id: 'showSpeedHeuristic',
        title: 'Speed Heuristic'
      },
      {
        id: 'showPlanningSTGraph',
        title: 'Planning S-T Graph'
      },
      {
        id: 'showPlanningVTGraph',
        title: 'Planning V-T Graph'
      },
      {
        id: 'showPlanningSpeed',
        title: 'Planning Speed'
      },
      {
        id: 'showPlanningAcceleration',
        title: 'Planning Acceleration'
      },
      {
        id: 'showPlanningTheta',
        title: 'Planning Theta'
      },
      {
        id: 'showPlanningKappa',
        title: 'Planning Kappa'
      },
      {
        id: 'showPlanningKappaDerivative',
        title: 'Planning Kappa Derivative'
      },
      {
        id: 'showReferenceLineTheta',
        title: 'Reference Line Theta'
      },
      {
        id: 'showReferenceLineKappa',
        title: 'Reference Line Kappa'
      },
      {
        id: 'showReferenceLineKappaDerivative',
        title: 'Reference Line Kappa Derivative'
      },
    ];

    return (
            <div className='planning-list'>
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
    );
  }
}