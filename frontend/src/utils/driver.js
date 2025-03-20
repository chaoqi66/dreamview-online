import Driver from 'driver.js';
import 'driver.js/dist/driver.css';

const steps = [
  {
    element: '#dreamview-doc',
    popover: {
      title: '说明文档',
      description: '点击可打开网页，查看dreamview使用说明文档',
      position: 'bottom',
    }
  },
  {
    element: '#config-list',
    popover: {
      title: '配置列表',
      description: '可选择不同配置下的视角观看',
      position: 'bottom',
    }
  },
  {
    element: '#showOperator',
    popover: {
      title: '开关列表',
      description: '打开出现开关列表，可根据需要打开或关闭对应开关',
      position: 'bottom',
    }
  },
  {
    element: '#car-status',
    popover: {
      title: '自车状态',
      description: '默认打开，显示状态信息',
      position: 'right',
    }
  },
  {
    element: '#delta-time',
    popover: {
      title: '时延',
      description: '点击打开显示各个模块的时延信息，可点击icon跳转文档查看计算公式',
      position: 'right',
    }
  },
  {
    element: '#lane-map',
    popover: {
      title: 'lanemap图层',
      description: '可查看lanemap对应图层',
      position: 'right',
    }
  },
  {
    element: '#gd-map',
    popover: {
      title: '自车路线',
      description: '打开后弹框显示，在高德地图显示自车轨迹',
      position: 'right',
    }
  },
  {
    element: '#turn-line',
    popover: {
      title: '道路结构路口中心线',
      description: '默认关闭，打开后显示道路结构路口的中心线信息，该线比较密集且意义不大较为吃性能，建议关闭',
      position: 'right',
    }
  },
  {
    element: '.camera-button',
    popover: {
      title: '相机',
      description: '可以打开多个相机，相机支持拖动、放大、切换视角',
      position: 'top',
    }
  },
  {
    element: '#faultReport',
    popover: {
      title: '故障弹框',
      description: '打开可查看上报的故障信息。绿色代表无故障；黄色代表存在WARNING级别报错；紫色代表存在ERROR级别报错；红色代表存在FATAL级别报错',
      position: 'left',
    }
  },
  {
    element: '#frame-rate',
    popover: {
      title: '帧率',
      description: '点击可查看各个模块的帧率 ',
      position: 'top',
    }
  },
  {
    element: '#followCar',
    popover: {
      title: '主界面视角是否跟车',
      description: '默认视角跟车，关闭后可右键拖动视野',
      position: 'left',
    }
  },
  {
    element: '#distance',
    popover: {
      title: '测距功能',
      description: '打开功能后，在主界面点击两点，可测量两点之间的距离，内容显示在上方',
      position: 'left',
    }
  },
  {
    element: '#pncNnCanvas',
    popover: {
      title: 'pnc多帧',
      description: '显示pnc选中的车道中心线多帧叠加效果',
      position: 'left',
    }
  },
  {
    element: '#textCanvas',
    popover: {
      title: '主界面文字开关',
      description: '可以控制主界面文字是否显示。默认显示',
      position: 'left',
    }
  },
  {
    element: '#speedAccChart',
    popover: {
      title: '自车速度与加速度',
      description: '上方图表为速度，单位是m/s。下方图表为加速度，单位是m/s&sup2;。',
      position: 'top',
    }
  },
  {
    element: '#angleChart',
    popover: {
      title: '方向盘转角',
      description: '该图标表示方向盘转角角度，左正右负',
      position: 'left',
    }
  },
];
const config = {
  steps: steps,
  overlayOpacity: 0.7,
  allowClose: true,
  nextBtnText: '下一步',
  prevBtnText: '上一步',
  doneBtnText: '完成',
};
const myDriver = Driver.driver();

export const startGuide = () => {
  myDriver.setConfig(config);
  myDriver.drive();
};