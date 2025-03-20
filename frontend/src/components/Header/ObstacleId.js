import React from 'react';
import STORE from 'store';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class ObstacleId extends React.Component {
  constructor(props) {
    super(props);

    this.handleObstacleIdChange = this.handleObstacleIdChange.bind(this);
  }

  handleObstacleIdChange(event) {
    STORE.meters.updateEnterObstacleId(event.target.value);
  }

  render() {
    return (
        <div className="obstacle-id">
            <input
                autoFocus
                placeholder="obstacle id"
                maxLength={5}
                onChange={this.handleObstacleIdChange}
            />
        </div>
    );
  }
}