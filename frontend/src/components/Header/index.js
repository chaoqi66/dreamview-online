import React from 'react';
import { inject, observer } from 'mobx-react';
import { getUrlParam } from 'utils/misc';

import Image from 'components/common/Image';
import logoApollo from 'assets/images/empty.png';
import QdlogoApollo from 'assets/images/qdempty1.png';
// import logoApollo from 'assets/images/logo_apollo.png';
// import logoApollo from 'assets/images/robosense.jpg';
import HMIControls from 'components/Header/HMIControls';
import Operator from 'components/Header/Operator';
import ObstacleId from 'components/Header/ObstacleId';
import BaseInfo from 'components/StatusBar/BaseInfo';
import { AudioOutlined } from '@ant-design/icons';

@inject('store') @observer
export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAudio: false,
    };
  }
  render() {
    const { meters } = this.props.store;
    const { showTimestamp } = this.props.store.options;
    const { issueDetail } = meters;
    const audioUrl = issueDetail?.fields?.customfield_10403 || '';
    const source = getUrlParam('source');

    return (
            <header className="header">
                <Image image={source === 'quickData' ? QdlogoApollo : logoApollo} className="apollo-logo" />
                {showTimestamp &&
                    <BaseInfo
                        timestampSec={meters.cyberTimestamp}
                        timestampTimeDiff={meters.timestampTimeDiff}
                        version={meters.version}
                        useHdmap={meters.useHdmap}
                    />
                }
                <AudioOutlined className='dreamview-audio' onClick={() => this.setState({ showAudio: !this.state.showAudio })} />
                {audioUrl && this.state.showAudio && <div className='dreamview-audio-box'>
                  <audio controls autoPlay onEnded={() => this.setState({ showAudio: false })}>
                    <source src={audioUrl} type="audio/wav" />
                    <source src={audioUrl} type="audio/mp3" />
                    <source src={audioUrl} type="audio/mpeg" />
                    <source src={audioUrl} type="audio/ogg" />
                  </audio>
                </div>}
                <ObstacleId />
                <Operator />
                {!OFFLINE_PLAYBACK && <HMIControls />}
            </header>
    );
  }
}
