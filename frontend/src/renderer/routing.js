import STORE from 'store';

import { drawDashedLineFromPoints, drawThickBandFromPoints } from 'utils/draw';

const _ = require('lodash');

export default class Routing {
  constructor() {
    this.routePaths = [];
    this.lastRoutingTime = -1;
  }

  update(routingTime, routePath, coordinates, scene) {
    this.routePaths.forEach((path) => {
      path.visible = STORE.options.showRouting;
    });
    // There has not been a new routing published since last time.
    if (this.lastRoutingTime === routingTime || routePath === undefined) {
      return;
    }

    this.lastRoutingTime = routingTime;

    // Clear the old route paths
    this.routePaths.forEach((path) => {
      scene.remove(path);
      path.material.dispose();
      path.geometry.dispose();
    });

    routePath.forEach((path) => {
      const points = coordinates.applyOffsetToArray(path.point);
      // const pathMesh = drawThickBandFromPoints(points, 0.3 /* width */,
      //   0xFF0000 /* red */, 0.6, 5 /* z offset */);
      const pathMesh = drawDashedLineFromPoints(points, 0xEC7E7E /* red */,
        2.0 /* width */, 1 /* dash size */, 1 /* gapSize */,
        5 /* z offset */, 0.9 /* opacity */);
      pathMesh.visible = STORE.options.showRouting;
      scene.add(pathMesh);
      this.routePaths.push(pathMesh);
    });
  }
}
