import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class CameraButton extends React.Component {
  getClassName(key) {
    if (this.props.store.options[key]) {
      return 'main-button button-selected';
    }
    return 'main-button';
  }

  render() {
    return (
            <div className="camera-button">
                <div
                  className={this.getClassName('showVideo')}
                  onClick={() => {
                    this.props.store.handleOptionToggle('showVideo');
                  }}
                >相机1</div>
                <div
                  className={this.getClassName('showVideo2')}
                  onClick={() => {
                    this.props.store.handleOptionToggle('showVideo2');
                  }}
                >相机2</div>
                <div
                  className={this.getClassName('showVideo3')}
                  onClick={() => {
                    this.props.store.handleOptionToggle('showVideo3');
                  }}
                >相机3</div>
            </div>
    );
  }
}