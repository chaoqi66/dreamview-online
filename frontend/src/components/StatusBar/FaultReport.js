import React from 'react';
import { inject, observer } from 'mobx-react';
import STORE from 'store';
import { CloseOutlined } from '@ant-design/icons';
import { Checkbox, Table } from 'antd';
import { toJS } from 'mobx';

@inject('store') @observer
export default class FaultReport extends React.Component {

  changeStart = e => {
    STORE.meters.updateMultiFrameLane(e.target.value, null);
  };

  onChange = e => {
    STORE.meters.updateAutoFaultReport(e.target.checked);
  };

  render() {
    let faultReport = toJS(STORE.meters.faultReport) || [];
    faultReport = faultReport.filter((fault, index, self) =>
      index === self.findIndex((t) => (
        t.faultCode === fault.faultCode && t.faultInfo === fault.faultInfo
      ))
    );

    const columns = [
      {
        title: 'Code',
        dataIndex: 'faultCode',
        key: 'faultCode',
      },
      {
        title: 'Level',
        dataIndex: 'faultLevel',
        key: 'faultLevel',
      },
      {
        title: 'Desc',
        dataIndex: 'faultName',
        key: 'faultName',
      },
    ];

    return (
      <div className="fault-report">
        <div className='fault-report-header'>
          <Checkbox checked={this.props.store.meters.autoFaultReport} onChange={this.onChange}>自动弹窗</Checkbox>
          <CloseOutlined onClick={() => {
            this.props.store.handleOptionToggle('showFaultReport');
          }} />
        </div>

        <Table
          columns={columns}
          dataSource={faultReport}
          pagination={false}
          rowKey={record => record.faultCode + record.faultInfo}
          rowClassName={(record, index) => {
            if (record.faultLevel === 'FATAL') {
              return 'fatal';
            }
            if (record.faultLevel === 'ERROR') {
              return 'error';
            }
            if (record.faultLevel === 'WARNING') {
              return 'warning';
            }
            return '';
          }}
          expandable={{
            expandedRowRender: record => <p style={{ margin: 0 }}>{record.faultInfo}</p>,
            rowExpandable: record => record.faultInfo !== undefined,
          }}
        />
      </div>
    );
  }
}