import React from 'react';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';

@inject('store') @observer
export default class CheckboxItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rangeList: [
        {label: '10m', value: 10},
        {label: '20m', value: 20},
        {label: '30m', value: 30},
        {label: '40m', value: 40},
        {label: '50m', value: 50},
        {label: '60m', value: 60},
        {label: '70m', value: 70},
        {label: '80m', value: 80},
        {label: '90m', value: 90},
        {label: '100m', value: 100},
        {label: '110m', value: 110},
        {label: '120m', value: 120},
      ],
    };
  }

  onRangeSelectChange = (event) => {
    if (event.target.value) {
      this.props.store.meters.updateAutoRange(event.target.value);
    }
  };

  render() {
    const {
      id, title, isChecked, onClick, disabled, extraClasses,
    } = this.props;
    const { meters } = this.props.store;
    return (
            <ul className={classNames({
              item: true,
              disabled,
            }, extraClasses)}
            >
                <li
                    id={id}
                    tabIndex="0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) {
                        onClick();
                      }
                    }}
                    onKeyPress={(event) => {
                      event.preventDefault();
                      if (event.key === 'Enter' || event.key === ' ') {
                        onClick();
                      }
                    }}
                >
                    <div className="switch">
                        <input
                            type="checkbox"
                            className="toggle-switch"
                            name={id}
                            checked={isChecked}
                            disabled={disabled}
                            readOnly
                        />
                        <label className="toggle-switch-label" htmlFor={id} />
                    </div>
                    {title && <span>{title}</span>}
                    {id === 'showRangeView' && <span className='point_cloud_channel_select point_cloud_color_select'>
                      <span className="arrow" />
                      <select
                        onClick={(e) => e.stopPropagation()}
                        onChange={this.onRangeSelectChange}
                        value={meters.autoRange}
                      >
                        {
                          this.state.rangeList.map((item) => {
                            return (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            );
                          })
                        }
                      </select>
                    </span>}
                </li>
            </ul>
    );
  }
}
