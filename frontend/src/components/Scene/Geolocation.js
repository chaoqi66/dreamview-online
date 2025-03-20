import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class Geolocation extends React.Component {
  render() {
    const { geolocation, options } = this.props.store;

    const x = geolocation && geolocation.x ? geolocation.x.toFixed(2) : '?';
    const y = geolocation && geolocation.y ? geolocation.y.toFixed(2) : '?';

    return (
            <div className="geolocation" style={{right: options.showSideBar ? '110px' : '20px'}}>
                {/* Mouse Geolocation: */}
                (
                {' '}
                {x}
                ,
                {' '}
                {y}
                {' '}
                )
            </div>
    );
  }
}
