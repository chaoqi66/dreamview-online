import { Progress } from 'antd';
import React from 'react';
import { observer, inject } from 'mobx-react';
import Draggable from 'react-draggable';
import { reaction } from 'mobx';
import RENDERER from 'renderer';
import STORE from 'store';
import { roundNumber } from 'utils/misc';

@inject('store') @observer
export default class Scene extends React.Component {
  constructor(props) {
    super(props);
    this.pncPreIndex = 0;
    this.state = {
      pncPreProgress: 0,
      total: 0,
    };
  }

  componentDidMount() {
    this.disposePncPre = reaction(
      () => this.props.store.options.showPncPre,
      (showPncPre) => {
        if (showPncPre) {
          setTimeout(() => {
            RENDERER.pncPreInitialize('pnc-pre-canvas', this.props.width * 0.35, this.props.height * 0.35);
          }, 500);
        }
      },
      { fireImmediately: true }
    );
  }

  pncPrerecord = () => {
    RENDERER.initPncPre();
    const list = STORE.meters.pncPreList;
    this.setState({ pncPreProgress: 0, total: roundNumber((list.length - 1) * 0.2, 1) });
    this.pncPreIndex = 0;
    document.removeEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keydown', this.handleKeyDown);
  };

  handleKeyDown = (event) => {
    const key = event.key.toLowerCase();
    const list = STORE.meters.pncPreList;

    if (list.length) {
      this.setState({ pncPreProgress: list.length});
      if (key === 'a') {
        const newIndex = this.pncPreIndex <= 0 ? 0 : this.pncPreIndex - 1;
        this.pncPreIndex = newIndex;
        RENDERER.updatePncPre(newIndex);
      }
      if (key === 'd') {
        const newIndex = this.pncPreIndex >= list.length - 1 ? 0 : this.pncPreIndex + 1;
        this.pncPreIndex = newIndex;
        RENDERER.updatePncPre(newIndex);
      }
      const progress = this.pncPreIndex / (list.length - 1) * 100;
      this.setState({ pncPreProgress: progress });
    }
  };

  handleProgressClick = (e) => {
    const list = STORE.meters.pncPreList;
    if (list.length) {
      const progressDiv = e.currentTarget;
      const clickPositionX = e.clientX - progressDiv.getBoundingClientRect().left;
      const progressBarWidth = progressDiv.clientWidth;
      const clickPercentage = clickPositionX / progressBarWidth;
      const index = Math.round(list.length * clickPercentage);
      RENDERER.updatePncPre(index);
      const progress = index / (list.length - 1);
      this.setState({ pncPreProgress: progress * 100 });
      this.pncPreIndex = index;
    }
  };

  render() {
    return (
      <div>
        {STORE.options.showPncPre && <Draggable>
          <div className="pnc-pre-canvas" id="pnc-pre-canvas" onWheel={e => {
            RENDERER.scalePncPre(e.deltaY);
          }}>
            <div className="record-btn" onClick={this.pncPrerecord}>录制</div>
            <div className="record-progress">
              <div className='time'>{roundNumber(this.pncPreIndex * 0.2, 1)} / {this.state.total}</div>
              <div className='progress' onClick={this.handleProgressClick}>
                <Progress
                  percent={this.state.pncPreProgress}
                  showInfo={false} size="small"
                  success={{ percent: this.state.pncPreProgres, strokeColor: 'red' }}
                />
              </div>
            </div>
          </div>
        </Draggable>}
      </div>
    );
  }
}