import { observable, action } from 'mobx';
import _ from 'lodash';

export default class VirtualCar {
    @observable virtualCar = '';

    @action update(world) {
      this.virtualCar = _.get(world, 'virtualCar');
    }
}
