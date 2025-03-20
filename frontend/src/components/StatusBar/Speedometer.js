import React from 'react';
import classNames from 'classnames';

const UNITS = [{
  name: 'km/h',
  conversionFromMeterPerSecond: 3.6,
}, {
  name: 'm/s',
  conversionFromMeterPerSecond: 1,
}, {
  name: 'mph',
  conversionFromMeterPerSecond: 2.23694,
}];

export default class Speedometer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      unit: 0,
    };

    this.changeUnit = this.changeUnit.bind(this);
  }

  changeUnit() {
    this.setState({
      unit: (this.state.unit + 1) % UNITS.length,
    });
  }

  render() {
    const { meterPerSecond, isRound } = this.props;

    const currUnit = UNITS[this.state.unit];
    const name = currUnit.name;
    // const read = Math.round(meterPerSecond * currUnit.conversionFromMeterPerSecond);
    let read = (meterPerSecond * currUnit.conversionFromMeterPerSecond).toFixed(2);
    if (isRound && this.state.unit === 0) {
      read = Math.round(read);
    }


    return (
      <span onClick={this.changeUnit}>
          <span className={classNames({
            'speed-read': true,
            'speed-ceil': isRound && this.state.unit === 0,
          })}>{read}</span>
          <span className="speed-unit">{name}</span>
      </span>
    );
  }
}
