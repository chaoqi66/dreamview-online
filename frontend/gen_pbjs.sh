#!/usr/bin/env bash

###############################################################################
# Copyright 2017 The Apollo Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###############################################################################

mkdir -p proto_bundle

# proto dependencies
SIMULATION_PROTO_FINAL='../proto/simulation_world_final.proto ../proto/simulation_world.proto ../proto/chart.proto ../proto/camera_update.proto ../proto/point_cloud.proto ../proto/road_structure.proto ../proto/efficient_lane_change.proto ../proto/behaviors.proto  ../proto/slim_road_net.proto ../proto/prediction.proto ../proto/traffic_light_fused.proto'
SIMULATION_PROTO='../proto/simulation_world.proto ../proto/chart.proto ../proto/camera_update.proto ../proto/road_structure.proto ../proto/efficient_lane_change.proto ../proto/behaviors.proto  ../proto/slim_road_net.proto ../proto/prediction.proto ../proto/traffic_light_fused.proto'
COMMON_PROTOS='../../common/proto/*.proto ../../common_msgs/config_msgs/vehicle_config.proto'
LOCALIZATION_PROTOS='../../localization/proto/localization.proto ../../localization/proto/pose.proto ../../localization/proto/localization_status.proto'
CHASSIS_PROTOS='../../a_canbus/proto/chassis.proto'
PLANNING_PROTOS='../../planning/proto/*.proto ../../planning/proto/math/*.proto ../../rs_planning/core_planning/proto/planning_status.proto'
AUDIO_PROTO='../../audio/proto/audio_common.proto ../../audio/proto//audio_event.proto'

PREDICTION_PROTOS='../../prediction/proto/feature.proto ../../prediction/proto/lane_graph.proto ../../prediction/proto/prediction_point.proto ../../prediction/proto/prediction_obstacle.proto ../../prediction/proto/scenario.proto'
PERCEPTION_PROTOS='../../perception/proto/traffic_light_detection.proto ../../perception/proto/perception_obstacle.proto'
REALTIVE_MAP_PROTOS='../../map/relative_map/proto/*.proto'
MAP_PROTOS='../../map/proto/*.proto'
MONITOR_PROTOS='../../common/monitor_log/proto/monitor_log.proto'
ROUTING_PROTOS='../../routing/proto/routing.proto'
COMMON_MSGS_PROTOS='../../common_msgs/*/*.proto'
RS_COMMON_MSGS_PROTOS='../../rs_common_msgs/proto_perception_msgs/*.proto ../../rs_common_msgs/proto_geometry_msgs/*.proto ../../rs_common_msgs/proto_std_msgs/*.proto ../../rs_common_msgs/proto_basic_msgs/*.proto  ../../rs_common_msgs/proto_world_model_msgs/Lane.proto ../../rs_common_msgs/proto_world_model_msgs/Intersection.proto'
LANE_MAP_PROTOS='../../rs_localization/rs_map/lanemap/msgs/*.proto'
RS_FAULT_REPORT='../../rs_faultreporter/proto/faultreporter/*.proto'

node_modules/protobufjs/bin/pbjs -t json $SIMULATION_PROTO \
    $COMMON_PROTOS $LOCALIZATION_PROTOS $CHASSIS_PROTOS $PLANNING_PROTOS \
    $PERCEPTION_PROTOS $MONITOR_PROTOS $ROUTING_PROTOS $MAP_PROTOS \
    $PREDICTION_PROTOS $REALTIVE_MAP_PROTOS $AUDIO_PROTO $COMMON_MSGS_PROTOS $LANE_MAP_PROTOS $RS_FAULT_REPORT $RS_COMMON_MSGS_PROTOS \
    -o proto_bundle/sim_world_proto_bundle.json

node_modules/protobufjs/bin/pbjs -t json $SIMULATION_PROTO_FINAL \
    $COMMON_PROTOS $LOCALIZATION_PROTOS $CHASSIS_PROTOS $PLANNING_PROTOS \
    $PERCEPTION_PROTOS $MONITOR_PROTOS $ROUTING_PROTOS $MAP_PROTOS \
    $PREDICTION_PROTOS $REALTIVE_MAP_PROTOS $AUDIO_PROTO $COMMON_MSGS_PROTOS $LANE_MAP_PROTOS $RS_FAULT_REPORT $RS_COMMON_MSGS_PROTOS \
    -o proto_bundle/cache_sim_world_proto_bundle.json
node_modules/protobufjs/bin/pbjs -t json ../proto/point_cloud.proto \
    -o proto_bundle/point_cloud_proto_bundle.json
node_modules/protobufjs/bin/pbjs -t json ../proto/history_localization.proto \
    -o proto_bundle/history_localization_bundle.json
node_modules/protobufjs/bin/pbjs -t json ../proto/history.proto \
    -o proto_bundle/history_bundle.json