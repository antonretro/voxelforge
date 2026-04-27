import * as BABYLON from '@babylonjs/core';

const DAY_DURATION = 1200; // seconds (20-minute day)

export class DayNight {
  constructor(engine) {
    this.engine = engine;
    this.scene  = engine.scene;
    this.time   = 0.25; // 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk

    this._createLights();
    this._createSky();
  }

  _createLights() {
    this.sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-1, -2, -1), this.scene);
    this.sun.intensity = 1.0;

    this.sky = new BABYLON.HemisphericLight('sky', new BABYLON.Vector3(0, 1, 0), this.scene);
    this.sky.intensity = 0.4;
    this.sky.diffuse   = new BABYLON.Color3(0.7, 0.8, 1.0);
    this.sky.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    this.ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, -1, 0), this.scene);
    this.ambient.intensity = 0.1;
  }

  _createSky() {
    const sky = BABYLON.MeshBuilder.CreateSphere('skyDome', { diameter: 900, sideOrientation: BABYLON.Mesh.BACKSIDE }, this.scene);
    const mat = new BABYLON.StandardMaterial('skyMat', this.scene);
    mat.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1.0);
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    sky.material = mat;
    sky.isPickable = false;
    this._skyMesh = sky;
    this._skyMat  = mat;
  }

  update(delta) {
    if (!this.engine.settings?.get('dayNightCycle')) return;
    this.time = (this.time + delta / DAY_DURATION) % 1;
    this._applyTime();
  }

  setTime(t) {
    this.time = ((t % 1) + 1) % 1;
    this._applyTime();
  }

  _applyTime() {
    const t = this.time;
    const angle = t * Math.PI * 2;

    // Sun position on arc
    this.sun.direction.set(
      Math.sin(angle) * 0.3 - 0.2,
      -Math.cos(angle),
      Math.sin(angle) * 0.1,
    );

    // Sun intensity: 0 at night, 1 at noon
    const sunFactor = Math.max(0, Math.cos(angle));
    this.sun.intensity = sunFactor * 1.2;
    this.sky.intensity = 0.3 + sunFactor * 0.5;

    // Sky color palette
    const skyColor = this._skyColorAt(t);
    this.scene.clearColor.set(skyColor.r, skyColor.g, skyColor.b, 1);
    this._skyMat.emissiveColor.copyFrom(skyColor);
    this.sky.diffuse.copyFrom(skyColor);
  }

  _skyColorAt(t) {
    // Keyframes: [time, r, g, b]
    const keys = [
      [0.00, 0.03, 0.03, 0.12], // midnight
      [0.20, 0.08, 0.06, 0.15], // pre-dawn
      [0.25, 0.80, 0.45, 0.20], // dawn
      [0.30, 0.55, 0.75, 1.00], // morning
      [0.50, 0.50, 0.70, 1.00], // noon
      [0.70, 0.55, 0.65, 0.90], // afternoon
      [0.75, 0.85, 0.40, 0.15], // dusk
      [0.80, 0.10, 0.07, 0.20], // evening
      [1.00, 0.03, 0.03, 0.12], // midnight
    ];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const f = (t - keys[i-1][0]) / (keys[i][0] - keys[i-1][0]);
        return new BABYLON.Color3(
          keys[i-1][1] + (keys[i][1] - keys[i-1][1]) * f,
          keys[i-1][2] + (keys[i][2] - keys[i-1][2]) * f,
          keys[i-1][3] + (keys[i][3] - keys[i-1][3]) * f,
        );
      }
    }
    return new BABYLON.Color3(0.5, 0.7, 1.0);
  }
}
