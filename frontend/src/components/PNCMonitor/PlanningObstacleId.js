import React from 'react';
import STORE from 'store';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class PlanningObstacleId extends React.Component {
  constructor(props) {
    super(props);

    this.handleObstacleIdChange = this.handleObstacleIdChange.bind(this);
  }

  handleObstacleIdChange(event) {
    STORE.planningData.updatePlanningObstacleId(event.target.value);
  }

  render() {
    return (
        <div className="planning-obstacle-id">
            <input
                autoFocus
                placeholder="obstacle id"
                maxLength={6}
                onChange={this.handleObstacleIdChange}
            />
        </div>
    );
  }
}
