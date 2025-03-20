import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';
import CheckboxItem from 'components/common/CheckboxItem';
import Draggable from 'react-draggable';

@inject('store') @observer
export default class NnPathSwitch extends React.Component {

  onChange = (id, checked) => {
    const obj = {};
    obj[id] = !checked;
    STORE.meters.updateNnPathSwitch(obj);
  };

  render() {
    const nnPathSwitch = STORE.meters.nnPathSwitch;
    const nnPathList = STORE.meters.nnPathList;
    return (
      <Draggable>
      <div className="behavior-map">
        <div className='title'>
          <div>NnPath switch</div>
        </div>
        {nnPathList.map((item, index) => {
          return <div className="switch-box">
                  <CheckboxItem
                      key={index}
                      id={index}
                      title={`nnPath ${index}`}
                      isChecked={nnPathSwitch[index] === true}
                      disabled={false}
                      onClick={() => {
                        this.onChange(index, nnPathSwitch[index]);
                      }}
                    />
                </div>;
        })}
      </div>
      </Draggable>
    );
  }
}