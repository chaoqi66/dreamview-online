import polyval from 'compute-polynomial';
import { random } from 'lodash';
import moment from 'moment-timezone';
import { message } from 'antd';

export function copyProperty(toObj, fromObj) {
  for (const property in fromObj) {
    if (fromObj.hasOwnProperty(property)) {
      toObj[property] = fromObj[property];
    }
  }
}

export function hideArrayObjects(objects, startIdx = 0) {
  if (objects.constructor === Array && objects.length > 0) {
    let idx = startIdx;
    for (;idx < objects.length; idx += 1) {
      objects[idx].visible = false;
    }
  }
}

const MILLISECONDS_IN_A_SECOND = 1000;
const MILLISECONDS_IN_A_MINUTE = 1000 * 60;

export function millisecondsToTime(duration) {
  let milliseconds = Math.floor(duration % 1000);
  let seconds = Math.floor((duration / MILLISECONDS_IN_A_SECOND) % 60);
  let minutes = Math.floor(duration / MILLISECONDS_IN_A_MINUTE);

  minutes = (minutes < 10) ? `0${minutes}` : minutes;
  seconds = (seconds < 10) ? `0${seconds}` : seconds;
  if (milliseconds < 10) {
    milliseconds = `00${milliseconds}`;
  } else if (milliseconds < 100) {
    milliseconds = `0${milliseconds}`;
  }

  return `${minutes}:${seconds}.${milliseconds}`;
}

export function timestampMsToTimeString(timestampMs, showMilliseconds = false) {
  const date = new Date(timestampMs);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours = (hours < 10) ? `0${hours}` : hours;
  minutes = (minutes < 10) ? `0${minutes}` : minutes;
  seconds = (seconds < 10) ? `0${seconds}` : seconds;
  let timeString = `${hours}:${minutes}:${seconds}`;

  if (showMilliseconds) {
    let milliseconds = date.getMilliseconds();
    if (milliseconds < 10) {
      milliseconds = `00${milliseconds}`;
    } else if (milliseconds < 100) {
      milliseconds = `0${milliseconds}`;
    }
    timeString += `:${milliseconds}`;
  }

  return timeString;
}

export function calculateLaneMarkerPoints(autoDrivingCar, laneMarkerData) {
  if (!autoDrivingCar || !laneMarkerData) {
    return [];
  }

  const adcX = autoDrivingCar.positionX;
  const adcY = autoDrivingCar.positionY;
  const heading = autoDrivingCar.heading;

  const c0 = laneMarkerData.c0Position;
  const c1 = laneMarkerData.c1HeadingAngle;
  const c2 = laneMarkerData.c2Curvature;
  const c3 = laneMarkerData.c3CurvatureDerivative;
  const markerRange = laneMarkerData.viewRange;
  const markerCoef = [c3, c2, c1, c0];

  const points = [];
  for (let x = 0; x < markerRange; ++x) {
    const y = polyval(markerCoef, x);
    const newX = x * Math.cos(heading) - y * Math.sin(heading);
    const newY = y * Math.cos(heading) + x * Math.sin(heading);
    points.push({ x: adcX + newX, y: adcY + newY });
  }
  return points;
}

function GetCross(p1, p2, p) {
  return (p2.x - p1.x) * (p.y - p1.y) - (p.x - p1.x) * (p2.y - p1.y);
}

export function IsPointInRectangle(points, p) {
  const isPointIn = GetCross(points[0], points[1], p) * GetCross(points[2], points[3], p) >= 0
    && GetCross(points[1], points[2], p) * GetCross(points[3], points[0], p) >= 0;
  return isPointIn;
}

export function pointOnVectorRight(p, p1, p2) {
  const p1p2 = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
  };
  const p1p = {
    x: p.x - p1.x,
    y: p.y - p1.y,
  };
  return (directionVectorCrossProduct(p1p2, p1p)) < 0;
}

export function directionVectorCrossProduct(p1, p2, abs = false) {
  // p1 X p2
  let crossProduct = p1.x * p2.y - p1.y * p2.x;
  if (abs) {
    crossProduct = Math.abs(crossProduct);
  }
  return crossProduct;
}

function directionVectorDotProduct(p1, p2) {
  // The same direction :p1·p2 >0 The opposite direction: <0
  return p1.x * p2.x + p1.y * p2.y;
}

export function getIntersectionPoint(p0, p1, p2) {
  // Projection of point p on vector p1p2(p1->p2)
  const vector12 = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
  };
  const normalizeVector12 = {
    x: vector12.x / Math.hypot(vector12.x, vector12.y),
    y: vector12.y / Math.hypot(vector12.x, vector12.y),
  };
  const vector10 = {
    x: p0.x - p1.x,
    y: p0.y - p1.y,
  };
  const vectorLength = Math.abs(directionVectorDotProduct(vector10, normalizeVector12));
  const vector1p = {
    x: normalizeVector12.x * vectorLength,
    y: normalizeVector12.y * vectorLength,
  };
  return {
    x: vector1p.x + p1.x,
    y: vector1p.y + p1.y,
  };
}

export function getPointDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function directionSameWithVector(p0, p1, vector) {
  return directionVectorDotProduct(vector, {
    x: p1.x - p0.x,
    y: p1.y - p0.y,
  }) > 0;
}

function getPointInFrontOf(points, p, vector) {
  return _.findIndex(points, point =>
    directionVectorDotProduct({
      x: point.x - p.x,
      y: point.y - p.y
    }, vector) > 0);
}

function getPointBehind(points, p, vector) {
  return _.findLastIndex(points, point =>
    directionVectorDotProduct({
      x: p.x - point.x,
      y: p.y - point.y
    }, vector) > 0);
}

export function getInFrontOfPointIndexDistanceApart(threshold, points, p, vector = null) {
  let index = _.isEmpty(vector) ? 0 : getPointInFrontOf(points, p, vector);
  if (index !== -1) {
    while (index <= points.length - 1) {
      if (getPointDistance(p, points[index]) >= threshold) {
        break;
      }
      index++;
    }
  }
  return index;
}

export function getBehindPointIndexDistanceApart(threshold, points, p, vector = null) {
  let index = _.isEmpty(vector) ? points.length - 1 : getPointBehind(points, p, vector);
  if (index !== -1) {
    while (index >= 0) {
      if (getPointDistance(p, points[index]) >= threshold) {
        break;
      }
      index--;
    }
  }
  return index;
}

export function toDate(stamp) {
  const { sec, nsec } = stamp;
  return new Date(sec * 1000 + nsec / 1e6);
}

export function formatTime(stamp, timezone, timeFormat) {
  if (stamp.sec < 0 || stamp.nsec < 0) {
    console.error('Times are not allowed to be negative');
    return '(invalid negative time)';
  }
  return moment.tz(toDate(stamp), timezone || moment.tz.guess()).format(timeFormat || 'YYYY-MM-DD hh:mm:ss.SSS A z');
}

export function fromSecStr(value) {
  const arr = value.split('.');
  const sec = parseInt(arr[0]);
  const nsecStr = '' + (arr[1] || 0);
  const nsec = nsecStr.length > 9 ? parseInt(nsecStr.substring(0, 9)) : parseInt(parseInt(nsecStr.padEnd(9, '0')));
  return { sec, nsec };
}

export function convertToTreeData(obj, parentKey = '') {
  return Object.keys(obj).map((key, index) => {
    const nodeKey = `${parentKey}-${key}`;

    if (Array.isArray(obj[key])) {
      return {
        title: key,
        key: `${nodeKey}-${index}`,
        children: obj[key].map((item, idx) => {
          const childKey = Array.isArray(item) ? `${index}-${idx}` : `${key}-${idx}`;
          if (typeof item === 'object' && item !== null) {
            return {
              title: `${idx}`,
              key: `${nodeKey}-${childKey}`,
              children: convertToTreeData(item, `${nodeKey}-${childKey}`)
            };
          } else {
            return {
              title: `${idx}`,
              key: `${nodeKey}-${childKey}`,
              children: convertToTreeData({ value: item }, `${nodeKey}-${childKey}`)
            };
          }
        })
      };
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      return {
        title: key,
        key: `${nodeKey}-${index}`,
        children: convertToTreeData(obj[key], `${nodeKey}-${key}`)
      };
    } else {
      return {
        title: `${key}: ${obj[key]}`,
        key: `${nodeKey}-${index}`
      };
    }
  });
}

export function roundNumber(value, decimalPlaces) {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return value;
  }

  const roundedValue = numericValue.toFixed(decimalPlaces);
  const roundedNumericValue = parseFloat(roundedValue);

  if (Number.isInteger(roundedNumericValue) && decimalPlaces > 0) {
    return numericValue.toFixed(0);
  }

  return roundedValue;
}

export function getUrlParam(name, url = '') {
  const urlParams = new URLSearchParams(url || window.location.search);
  return urlParams.get(name) || '';
}

export async function fetchRequest(option = {}) {
  const defaultOpt = {
    url: '',
    method: 'get',
    headers: {},
    other: {},
    data: {}
  };
  option = Object.assign({}, defaultOpt, option);
  const fetchOption = {
    headers: option.headers,
    method: option.method,
    ...option.other
  };

  if (option.method.toLowerCase() === 'get') {
    // get方法将参数拼接在url后面
    const values = Object.values(option.data);
    const keys = Object.keys(option.data);
    const arr = [];
    for (let i = 0; i < values.length; i++) {
      arr.push(`${keys[i]}=${values[i]}`);
    }
    const str = arr.join('&');
    if (str) {
      option.url += `?${str}`;
    }
  } else if (option.method.toLowerCase() === 'post') {
    // post请求将参数转为JSON字符串传给body
    fetchOption.body = JSON.stringify(option.data);
  }

  // 请求方法
  const fetchData = await fetch(option.url, fetchOption);
  const response = await fetchData.json();
  return response;
}

export function getMenuIdOptionMap() {
  const menuIdOptionMapping = {};
  for (const name in PARAMETERS.options) {
    const option = PARAMETERS.options[name];
    if (option.menuId) {
      menuIdOptionMapping[option.menuId] = name;
    }
  }
  return menuIdOptionMapping;
}

export function convertToUpperCaseWithUnderscore(str) {
  if (str === str.toUpperCase()) {
    return str;
  }
  return str.replace(/[A-Z]/g, '_$&').toUpperCase();
}

export const copyTxt = (text) => {
  const input = document.createElement('input'); // 创建input对象
  input.value = text; // 设置复制内容
  document.body.appendChild(input); // 添加临时实例
  input.select(); // 选择实例内容
  document.execCommand('Copy'); // 执行复制
  document.body.removeChild(input); // 删除临时实例
  message.success('copy success');
};

export const copyHtmlText = (value) => {
  // 创建一个隐藏的 div 元素来存放 HTML 内容
  const htmlContent = value;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  // 创建一个 Range 对象
  const range = document.createRange();
  range.selectNodeContents(tempDiv);

  // 清除当前的选区并添加新的 Range
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    // 执行 copy 命令
    const successful = document.execCommand('copy');
    if (successful) {
      message.success('复制成功！');
    } else {
      message.warning('复制失败！');
    }
  } catch (error) {
    message.warning('复制失败！' + error);
  }

  // 移除临时的 div 元素
  document.body.removeChild(tempDiv);

  // 清除选区
  selection.removeAllRanges();
};

export const findMaxProperty = (obj) => {
  let maxProp = null;
  let maxValue = Number.NEGATIVE_INFINITY;

  // 遍历对象的属性
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (obj[prop] > maxValue) {
        maxValue = obj[prop];
        maxProp = prop;
      }
    }
  }
  return maxProp;
};

export const getCurConfig = () => {
  const parameters_url = localStorage.getItem('PARAMETERS_URL');
  const parameters_obj = parameters_url ? JSON.parse(parameters_url) : {};
  return parameters_obj.label || 'default';
};