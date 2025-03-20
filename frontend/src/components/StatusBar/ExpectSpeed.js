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
export default class ExpectSpeed extends React.Component {
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

  render() {
    const { throttlePercent, brakePercent, acceleration, steeringAngleRad, speed } = this.props;

    return (
            <div className="expect-speed">
                <Speedometer meterPerSecond={roundNumber(speed, 2)} isRound={true} />
                <span>
                    <span className='angle-read'>{steeringAngleRad}</span>
                    <span className="angle-unit">&deg;</span>
                    <div className={`triangle-left angle-icon-left ${steeringAngleRad > 0 ? 'triangle-left-highlight' : ''}`}></div>
                    <div className={`triangle-right angle-icon-right ${steeringAngleRad < 0 ? 'triangle-right-highlight' : ''}`}></div>
                </span>
                {/* <span>
                    <span className="acc-read">{acceleration}</span>
                    <span className="acc-unit">m/s<sup>2</sup></span>
                </span> */}
            </div>
    );
  }
}
