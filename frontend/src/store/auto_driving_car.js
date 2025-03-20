import { observable, action } from 'mobx';
import _ from 'lodash';

export default class AutoDrivingCar {
    @observable autoDrivingCar = '';

    @action update(world) {
      this.autoDrivingCar = _.get(world, 'autoDrivingCar');
    }
}
