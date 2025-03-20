import React from 'react';
import { observer } from 'mobx-react';
import { roundNumber } from 'utils/misc';
import Speedometer from 'components/StatusBar/Speedometer';

class Meter extends React.Component {
  render() {
    const {
      label, percentage, meterColor, background,
    } = this.props;

    const percentageString = `${percentage}%`;

    return (
            <div className="meter-container">
                <div className="meter-label">
                    {label}
                    <span className="meter-value">{percentageString}</span>
                </div>
                <span
                    className="meter-head"
                    style={{ borderColor: meterColor }}
                />
                <div
                    className="meter-background"
                    style={{ backgroundColor: background }}
                >
                    <span style={{
                      backgroundColor: meterColor,
                      width: percentageString,
                    }}
                    />
                </div>
            </div>
    );
  }
}

@observer
export default class AutoMeter extends React.Component {
  constructor(props) {
    super(props);
    this.setting = {
      brake: {
        label: 'Brake',
        meterColor: '#B43131',
        background: '#382626',
      },
      accelerator: {
        label: 'Accelerator',
        meterColor: '#006AFF',
        background: '#2D3B50',
      },
    };
  }

  getClassName(acc) {
    if (acc > 2) {
      return 'acc-read text-green';
    }
    if (acc > -1) {
      return 'acc-read';
    }
    if (acc >= -2 && acc <= -1) {
      return 'acc-read text-yellow';
    }
    if (acc < -2) {
      return 'acc-read text-red';
    }
    return 'acc-read';
  }

  render() {
    const { throttlePercent, brakePercent, acceleration, speed } = this.props;

    return (
            <div className="auto-meter">
                <Speedometer meterPerSecond={roundNumber(speed, 2)} />
                <span>
                    <span className={this.getClassName(acceleration)}>{roundNumber(acceleration, 2)}</span>
                    <span className="acc-unit">m/s<sup>2</sup></span>
                </span>
                {/* <div className="brake-panel">
                    <Meter
                        label={this.setting.brake.label}
                        percentage={brakePercent}
                        meterColor={this.setting.brake.meterColor}
                        background={this.setting.brake.background}
                    />
                </div>
                <div className="throttle-panel">
                    <Meter
                        label={this.setting.accelerator.label}
                        percentage={throttlePercent}
                        meterColor={this.setting.accelerator.meterColor}
                        background={this.setting.accelerator.background}
                    />
                </div> */}
            </div>
    );
  }
}
