import React from 'react';
import classNames from 'classnames';

import UTTERANCE from 'store/utterance';

export default class DrivingMode extends React.PureComponent {
  componentWillUpdate() {
    UTTERANCE.cancelAllInQueue();
  }

  render() {
    const { drivingMode, newDrivingMode, isAutoMode, isNewAutoMode } = this.props;

    // UTTERANCE.speakOnce(`${newDrivingMode} mode`);

    return (
            <div className={classNames({
              'driving-mode': true,
              'auto-mode': isNewAutoMode,
              'manual-mode': !isNewAutoMode,
            })}
            >
                <span className="text">{newDrivingMode}</span>
            </div>
    );
  }
}
