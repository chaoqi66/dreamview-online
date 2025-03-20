import React from 'react';
import { inject, observer } from 'mobx-react';
import { correctionTypeMap, correctionTypeColorMap } from 'utils/constant';
import STORE from 'store/index';

@inject('store') @observer
export default class CorrectionType extends React.Component {

  getCorrectionColor(type) {
    return correctionTypeColorMap[type] || '#fff';
  }

  render() {
    const { correctionType } = STORE.meters;

    return (
            <div className="battery-and-gears correction-type">
                <div className="left-div">
                    <div className="text">接管类型</div>
                </div>
                <div className="right-div">
                    <div className="text" style={{color: this.getCorrectionColor(correctionType)}}>{correctionTypeMap[correctionType]}</div>
                </div>
            </div>
    );
  }
}