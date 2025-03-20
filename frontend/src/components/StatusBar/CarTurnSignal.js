import React from 'react';
import { observer, inject} from 'mobx-react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

@inject('store') @observer
export default class CarTurnSignal extends React.Component {

  render() {
    const { leftTurnSignal, rightTurnSignal } = this.props;

    return (
      <div className="turn-signal">
        <div className="left-turn-signal">
          <ArrowLeftOutlined className={leftTurnSignal ? 'icon turn' : 'icon'} />
        </div>
        <div className="right-turn-signal">
          <ArrowRightOutlined className={rightTurnSignal ? 'icon turn' : 'icon'} />
        </div>
      </div>
    );
  }
}
