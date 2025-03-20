import React from 'react';
import { inject, observer } from 'mobx-react';

import CheckboxItem from 'components/common/CheckboxItem';

@inject('store') @observer
export default class ControlCheckList extends React.Component {
  render() {
    const { options } = this.props.store;
    const checkboxList = [
      {
        id: 'showControlTrajectory',
        title: 'Trajectory'
      },
      {
        id: 'showControlSpeed',
        title: 'Speed'
      },
      {
        id: 'showControlAcceleration',
        title: 'Acceleration'
      },
      {
        id: 'showControlCurvature',
        title: 'Curvature'
      },
      {
        id: 'showControlStationError',
        title: 'Station Error'
      },
      {
        id: 'showControlLateralError',
        title: 'Lateral Error'
      },
      {
        id: 'showControlHeadingError',
        title: 'Heading Error'
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