import _ from 'lodash';
import { inject, observer } from 'mobx-react';
import React from 'react';

import RadioItem from 'components/common/RadioItem';

import { POINT_CLOUD_WS } from 'store/websocket';
import { getMenuIdOptionMap } from 'utils/misc';

import './style.scss';

const defaultPointCloud = '/lidar_tm_m1p/compensate/rslidar_points';

@inject('store') @observer
class MenuItemCheckbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channels: [],
      pointCloudColors: [
        {label: 'intensity', value: '0'},
        {label: 'height', value: '1'},
        {label: 'plant', value: '2'},
        {label: 'intensityMap', value: '3'},
      ],
      pointCloudSizes: [
        {label: '0.05', value: 0.05},
        {label: '0.06', value: 0.06},
        {label: '0.07', value: 0.07},
        {label: '0.08', value: 0.08},
        {label: '0.09', value: 0.09},
        {label: '0.10', value: 0.10},
        {label: '0.11', value: 0.11},
        {label: '0.12', value: 0.12},
      ],
    };
  }

  componentDidMount() {
    // const {
    //   id,
    //   options,
    // } = this.props;
    // setTimeout(() => {
    //   if (id === 'perceptionPointCloud') {
    //     POINT_CLOUD_WS.togglePointCloud(options.showPointCloud);
    //     POINT_CLOUD_WS.getPointCloudChannel().then((channels) => {
    //       this.setState({ channels });
    //       if (channels && channels.includes(defaultPointCloud)) {
    //         const event = {
    //           target: {
    //             value: defaultPointCloud
    //           }
    //         };
    //         this.onStatusSelectChange(event);
    //       }
    //     }).catch(
    //       err => {
    //         this.setState({ channels: [] });
    //       }
    //     );
    //   }
    // }, 3000);
  }

  onStatusSelectChange = (event) => {
    if (event.target.value) {
      POINT_CLOUD_WS.changePointCloudChannel(event.target.value);
    }
  };

  onColorSelectChange = (event) => {
    if (event.target.value) {
      this.props.store.hmi.updateStatus({ currentPointCloudColor:  event.target.value});
    }
  };

  onSizeSelectChange = (event) => {
    if (event.target.value) {
      this.props.store.hmi.updateStatus({ currentPointCloudSize:  event.target.value});
    }
  };

  render() {
    const {
      id,
      title,
      optionName,
      options,
      isCustomized,
      store,
    } = this.props;

    const { hmi } = store;
    return (
      <ul className="item">
        <li
          id={id}
          onClick={(e) => {
            e.stopPropagation();
            const optionsIds = ['showPredictionMonitor', 'showPNCMonitor', 'showEfficientLaneMonitor', 'showRoadNetProposals'];
            if (optionsIds.includes(id)) {
              this.props.store.handleOptionToggle(id);
            } else {
              options.toggle(optionName, isCustomized);
            }
            // if (id === 'perceptionPointCloud') {
            //   POINT_CLOUD_WS.togglePointCloud(options.showPointCloud);
            //   POINT_CLOUD_WS.getPointCloudChannel().then((channels) => {
            //     this.setState({ channels });
            //   }).catch(
            //     err => {
            //       this.setState({ channels: [] });
            //     }
            //   );
            // }
          }}
        >
          <div className="switch">
            <input
              type="checkbox"
              name={id}
              className="toggle-switch"
              id={id}
              checked={isCustomized ? options.customizedToggles.get(optionName)
                : options[optionName]}
              readOnly

            />
            <label className="toggle-switch-label" htmlFor={id} />
          </div>
          <span>{title}</span>
          {/* {id === 'perceptionPointCloud' && <span className='point_cloud_channel_select'>
            <span className="arrow" />
            <select
              onClick={(e) => e.stopPropagation()}
              value={hmi.currentPointCloudChannel}
              onChange={this.onStatusSelectChange}
            >
              <option key={'select-channel'} value={''}>- select channel -</option>
              {
                this.state.channels.map((channel) => {
                  return (
                    <option key={channel} value={channel}>{channel}</option>
                  );
                })
              }
            </select>
          </span>} */}

          {id === 'perceptionPointCloud' && <span className='point_cloud_channel_select point_cloud_color_select'>
            <span className="arrow" />
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={this.onColorSelectChange}
              value={hmi.currentPointCloudColor}
            >
              {
                this.state.pointCloudColors.map((item) => {
                  return (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  );
                })
              }
            </select>
          </span>}

          {id === 'perceptionPointCloud' && <span className='point_cloud_channel_select point_cloud_color_select'>
            <span className="arrow" />
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={this.onSizeSelectChange}
              value={hmi.currentPointCloudSize}
            >
              {
                this.state.pointCloudSizes.map((item) => {
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

@observer
export default class SubMenu extends React.Component {
  constructor(props) {
    super(props);

    this.menuIdOptionMapping = getMenuIdOptionMap();
  }

  render() {
    const {
      tabId, tabType, options, title, id, dataId, isCustomized = false
    } = this.props;
    let entries = null;
    if (tabType === 'checkbox') {
      entries =
        <MenuItemCheckbox
          key={dataId}
          id={dataId}
          title={title}
          optionName={id}
          options={options}
          isCustomized={isCustomized}
        />;
    } else if (tabType === 'radio') {
      // Now we only have camera tab using radio in menu
      if (tabId === 'camera') {
        entries =
          <RadioItem
            key={`${tabId}_${title}`}
            id={tabId}
            onClick={() => {
              options.selectCamera(title);
            }}
            checked={options.cameraAngle === title}
            title={_.startCase(title)}
          />;
      }
    }
    return entries;
  }
}