import React from 'react';
import { observer } from 'mobx-react';

import PlanningStatus from 'components/PNCMonitor/PlanningStatus';
import PlanningCheckList from 'components/PNCMonitor/PlanningCheckList';
import ControlCheckList from 'components/PNCMonitor/ControlCheckList';
import BaseInfo from 'components/StatusBar/BaseInfo';
import AutoMeter from 'components/StatusBar/AutoMeter';
import ExpectSpeed from 'components/StatusBar/ExpectSpeed';
import CarTurnSignal from 'components/StatusBar/CarTurnSignal';
import Electricity from 'components/StatusBar/Electricity';
import Gears from 'components/StatusBar/Gears';
import DrivingAction from 'components/StatusBar/DrivingAction';
import RtkStatus from 'components/StatusBar/RtkStatus';
import LocalizationStatus from 'components/StatusBar/LocalizationStatus';
import TrafficLightSign from 'components/StatusBar/TrafficLightSign';
import LaneTrafficLight from 'components/StatusBar/LaneTrafficLight';
import RoadTrafficLight from 'components/StatusBar/RoadTrafficLight';
import PaddleInfo from 'components/StatusBar/PaddleInfo';
import SteeringTorqueNm from 'components/StatusBar/SteeringTorqueNm';
import CorrectionType from 'components/StatusBar/CorrectionType';
import ThrottlePercentage from 'components/StatusBar/ThrottlePercentage';
import MotorTorque from 'components/StatusBar/MotorTorque';
import HumanIntervention from 'components/StatusBar/HumanIntervention';
import MessageSize from 'components/StatusBar/MessageSize';
import DeltaTime from 'components/StatusBar/DeltaTime';
import ObstaclesInfo from 'components/StatusBar/ObstaclesInfo';
import Notification from 'components/StatusBar/Notification';
import TrafficLightIndicator from 'components/StatusBar/TrafficLightIndicator';
import DrivingMode from 'components/StatusBar/DrivingMode';
import Wheel from 'components/StatusBar/Wheel';
import Rss from 'components/StatusBar/Rss';
import DeltaTimeButton from 'components/StatusBar/DeltaTimeButton';
// import SpeedAndAcc from 'components/StatusBar/SpeedAndAcc';

@observer
export default class StatusBar extends React.Component {
  render() {
    const {
      meters, trafficSignal, showNotification, showTimestamp,
      showPlanningRSSInfo, showPNCMonitor, monitor,
      selectPNCMonitorTab, showPNCPlanningPanel, showPNCControlPanel,
      showPlanningStatusPanel, showMessageSize, showTimeInterval, showControlPanel,
      showDeltaTime, showSpeedAcc, virtualCar, showVirtualChassis
    } = this.props;

    return (
            <div className="status-bar">
                {/* {showTimestamp &&
                    <BaseInfo
                        timestampSec={meters.cyberTimestamp}
                        timestampTimeDiff={meters.timestampTimeDiff}
                        version={meters.version}
                    />
                } */}
                {/* {!showPNCMonitor && showSpeedAcc && <div className='speed-acc'>
                    <SpeedAndAcc isDefault={true} />
                </div>} */}
                {showPlanningStatusPanel && <PlanningStatus />}
                {/* {showNotification
                    && (
                        <Notification
                            monitor={monitor}
                            showPlanningRSSInfo={showPlanningRSSInfo}
                        />
                    )} */}
                {showPlanningRSSInfo && <Rss monitor={monitor} />}
                <AutoMeter
                    throttlePercent={meters.throttlePercent}
                    brakePercent={meters.brakePercent}
                    acceleration={showVirtualChassis ? virtualCar?.acceleration || 0 : meters.acceleration}
                    speed={showVirtualChassis ? virtualCar?.speed || 0 : meters.speed}
                />
                <ExpectSpeed
                    throttlePercent={meters.throttlePercent}
                    brakePercent={meters.brakePercent}
                    acceleration={meters.acceleration}
                    speed={meters.expectationSpeed}
                    steeringAngleRad={showVirtualChassis ? virtualCar?.steeringAngleRad || 0 : meters.steeringAngleRad}
                />
                <CarTurnSignal leftTurnSignal={meters.leftTurnSignal} rightTurnSignal={meters.rightTurnSignal} />
                {/* <Wheel
                    steeringPercentage={meters.steeringPercentage}
                    steeringAngle={meters.steeringAngle}
                    steeringAngleRad={meters.steeringAngleRad}
                    turnSignal={meters.turnSignal}
                /> */}
                <div className="traffic-light-and-driving-mode">
                    <TrafficLightIndicator colorName={trafficSignal.color} />
                    <DrivingMode
                        drivingMode={meters.drivingMode}
                        newDrivingMode={meters.newDrivingMode}
                        isAutoMode={meters.isAutoMode}
                        isNewAutoMode={meters.isNewAutoMode}
                    />
                </div>
                <Electricity
                    electricityPercentage={meters.batteryPercentage}
                />
                {/* <TrafficLightSign
                    electricityPercentage={meters.batteryPercentage}
                    trafficLightSign={meters.trafficLightSign}
                /> */}

                {<LaneTrafficLight
                    laneLightSet={meters.laneLightSet}
                />}
                {<RoadTrafficLight
                    trafficLightFused={meters.trafficLightFused}
                />}
                {showControlPanel &&
                    <Gears
                        electricityPercentage={meters.batteryPercentage}
                        currentGear={meters.gearLocation}
                    />
                }
                {showControlPanel &&
                    <DrivingAction
                        electricityPercentage={meters.batteryPercentage}
                        drivingAction={meters.drivingAction}
                    />
                }
                {showControlPanel &&
                    <RtkStatus
                        electricityPercentage={meters.batteryPercentage}
                        rtkStatus={meters.rtkStatus}
                    />
                }
                {showControlPanel &&
                    <LocalizationStatus
                        electricityPercentage={meters.batteryPercentage}
                        locQuality={meters.locQuality}
                    />
                }
                {showControlPanel &&
                    <PaddleInfo
                        electricityPercentage={meters.batteryPercentage}
                        humanLanePreference={meters.humanLanePreference}
                    />
                }
                <CorrectionType
                    steeringTorqueNm={meters.steeringTorqueNm}
                />

                <SteeringTorqueNm
                    steeringTorqueNm={meters.steeringTorqueNm}
                />

                <ThrottlePercentage
                    throttlePercent={meters.throttlePercent}
                />

                <MotorTorque
                    motorTorque={meters.motorTorque}
                />

                <HumanIntervention
                    humanIntervention={meters.humanIntervention}
                />

                {showMessageSize &&
                    <MessageSize
                        meters={meters}
                    />
                }
                {showDeltaTime &&
                    <DeltaTime
                        meters={meters}
                    />
                }
                {showTimeInterval &&
                    <ObstaclesInfo
                        meters={meters}
                    />
                }
                {showPNCMonitor && (selectPNCMonitorTab === 0) && showPNCPlanningPanel && <PlanningCheckList />}
                {showPNCMonitor && (selectPNCMonitorTab === 1) && showPNCControlPanel && <ControlCheckList />}
                <DeltaTimeButton />
            </div>
    );
  }
}
