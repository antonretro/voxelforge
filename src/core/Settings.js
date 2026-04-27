const DEFAULTS = {
  username:        'Player',
  skinUsername:    '',
  renderDistance:  4,
  fov:             75,
  mouseSensitivity: 0.003,
  touchSensitivity: 0.005,
  shadows:         true,
  shadowQuality:   'medium',  // low | medium | high
  antiAlias:       true,
  resolutionScale: 1.0,
  fpsCap:          60,
  frameSkip:       true,  // cap render rate to fpsCap, saving GPU on high-refresh displays
  masterVolume:    1.0,
  musicVolume:     0.5,
  sfxVolume:       0.8,
  gameMode:        'creative', // creative | survival
  dayNightCycle:   true,
  showFPS:         false,
  showCoords:      false,
  texturePack:     'igneous',  // folder name under /textures/packs/
  language:        'en',
};

const KEY = 'voxelforge_settings';

class Settings {
  constructor() {
    this._data = { ...DEFAULTS };
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      this._data = { ...DEFAULTS, ...saved };
    } catch {
      this._data = { ...DEFAULTS };
    }
  }

  save() {
    localStorage.setItem(KEY, JSON.stringify(this._data));
  }

  get(key) {
    return this._data[key];
  }

  set(key, value) {
    this._data[key] = value;
    this.save();
  }

  getAll() {
    return { ...this._data };
  }

  reset() {
    this._data = { ...DEFAULTS };
    this.save();
  }
}

export const settings = new Settings();
