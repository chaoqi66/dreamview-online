import React from 'react';
import { inject, observer } from 'mobx-react';
import classNames from 'classnames';

// import loaderImg from 'assets/images/logo_apollo.png';
import loaderImg from 'assets/images/big_rsd.png';
import loaderGif from 'assets/images/loader_apollo.gif';
import logoApollo from 'assets/images/logo_apollo.png';

@inject('store') @observer
export default class Loader extends React.PureComponent {
  render() {
    const { extraClasses, offlineViewErr } = this.props;
    const { meters } = this.props.store;

    let message = '数据加载中，请稍候...';
    if (OFFLINE_PLAYBACK) {
      message = offlineViewErr || 'Loading ....';
    }
    let imgSrc = '';
    if (OFFLINE_PLAYBACK) {
      imgSrc = loaderGif;
    } else {
      imgSrc = meters.logo === 'Apollo' ? logoApollo : loaderImg;
    }

    return (
            <div className="loader">
                <div className={classNames('img-container', extraClasses)}>
                    { meters.logo && <img src={imgSrc} alt="Loader" />}
                    <div className={offlineViewErr ? 'error-message' : 'status-message'}>
                        {message}
                    </div>
                </div>
            </div>
    );
  }
}
