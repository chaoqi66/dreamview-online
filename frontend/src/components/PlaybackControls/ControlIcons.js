import React from 'react';

import classNames from 'classnames';
import playImg from 'assets/images/icons/play.png';
import pauseImg from 'assets/images/icons/pause.png';
import replayImg from 'assets/images/icons/replay.png';
import fullscreenImg from 'assets/images/icons/fullscreen.png';
import normalScreenImg from 'assets/images/icons/fullscreen-expand-filling.png';
class PlayIcons extends React.Component {
  render() {
    const { onClick } = this.props;

    return (
      <img className="icon-img" src={playImg}/>
    );
  }
}

class ReplayIcons extends React.Component {
  render() {
    const { onClick } = this.props;

    return (
      <img style={{ 'width': '20px' }} className="icon-img" src={replayImg}/>
    );
  }
}

class PauseIcons extends React.Component {
  render() {
    const { onClick } = this.props;

    return (
      <img style={{ 'width': '14px' }} className="icon-img" src={pauseImg}/>
    );
  }
}


export default class ControlIcons extends React.Component {
  render() {
    const { type, onClick, extraClasses } = this.props;

    let icon = null;
    switch (type) {
      case 'replay':
        icon = <ReplayIcons />;
        break;
      case 'pause':
        icon = <PauseIcons />;
        break;
      case 'play':
        icon = <PlayIcons />;
        break;
      default:
        break;
    }

    return (
            <div className={classNames(extraClasses)} onClick={onClick}>
                {icon}
                {/* <PlayIcons /> <ReplayIcons /><PauseIcons /> */}
            </div>
    );
  }
}
