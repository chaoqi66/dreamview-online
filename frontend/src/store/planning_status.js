import { observable, action } from 'mobx';
import _ from 'lodash';

export default class PlanningStatus {
    @observable trajectoryType = '';

    @observable replanReason = [];

    @observable laneChangeFsmStatus = [];

    @observable expectationSpeed = '';

    @observable latErrorToLaneCenter = '';

    @observable pncDebug = '';

    @observable lonBehavior = '';

    @observable planningMode = '';

    @observable naviType = '';

    @observable roadIdList = {};

    @observable laneMapVersion = '';

    @observable lccStatus = '';

    @observable destination = {};

    @action update(world) {
      this.trajectoryType = _.get(world, 'trajectoryType');
      this.replanReason = _.get(world, 'replanReason');
      this.laneChangeFsmStatus = _.get(world, 'laneChangeFsmStatus');
      this.expectationSpeed = _.get(world, 'expectationSpeed');
      this.latErrorToLaneCenter = _.get(world, 'latErrorToLaneCenter');
      this.pncDebug = world?.effLcNnInfo;
      this.lonBehavior = world?.debug?.ilqrDebug?.lonBehavior;
      this.naviType = world?.naviRoute?.naviType;
      this.lccStatus = world?.naviRoute?.lccStatus || '';
      this.destination = world?.naviRoute?.destination || {};
      this.planningMode = world?.planningMode?.planningMode;
      this.roadIdList = world?.roadIdList || {};
      this.laneMapVersion = world?.laneMapVersion;
    }
}
