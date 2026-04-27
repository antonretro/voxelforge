import * as BABYLON from '@babylonjs/core';
import { BLOCK_DEFS } from '../data/blocks.js';

export class BlockRegistry {
  constructor(scene) {
    this.scene = scene;
    this.blocks = new Map();
    this.textureMap = new Map();
    this.textureLayers = [];
    this.atlasTexture = null;
    this.opaqueMaterial = null;
    this.alphaMaterial = null;
    this.texturePack = 'igneous';
    this.isReady = false;
    this._zipOverrides = new Map(); // textureName -> HTMLImageElement (from ZIP)
  }

  async init(texturePack = 'igneous') {
    this.texturePack = texturePack;

    for (const def of BLOCK_DEFS) {
      this.blocks.set(def.id, def);
      for (const tex of Object.values(def.textures || {})) {
        if (tex && !this.textureMap.has(tex)) {
          this.textureMap.set(tex, this.textureLayers.length);
          this.textureLayers.push(tex);
        }
      }
    }

    await this._buildAtlas();
    this.isReady = true;
  }

  async swapTexturePack(packName) {
    this.texturePack = packName;
    this._zipOverrides.clear();
    this._disposeAtlas();
    await this._buildAtlas();
  }

  async swapTexturePackFromZip(file) {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);

    this._zipOverrides.clear();

    // Support both standard resource-pack layout and flat zips
    const blockPaths = [
      /assets\/minecraft\/textures\/block\/(.+\.png)$/,
      /textures\/block\/(.+\.png)$/,
      /^block\/(.+\.png)$/,
      /^(.+\.png)$/,
    ];

    const loadTasks = [];
    zip.forEach((relPath, entry) => {
      if (entry.dir) return;
      for (const pattern of blockPaths) {
        const m = relPath.match(pattern);
        if (m) {
          const texName = m[1].replace(/\.png$/, '');
          loadTasks.push(
            entry.async('blob').then(blob => {
              return new Promise((resolve) => {
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => { URL.revokeObjectURL(url); this._zipOverrides.set(texName, img); resolve(); };
                img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
                img.src = url;
              });
            })
          );
          break;
        }
      }
    });

    await Promise.all(loadTasks);
    this._disposeAtlas();
    await this._buildAtlas();
  }

  _disposeAtlas() {
    this.atlasTexture?.dispose();
    this.opaqueMaterial?.dispose();
    this.alphaMaterial?.dispose();
    this.atlasTexture = null;
    this.opaqueMaterial = null;
    this.alphaMaterial = null;
  }

  async _buildAtlas() {
    const TILE = 16;
    const COUNT = this.textureLayers.length;

    const canvases = await Promise.all(this.textureLayers.map(name => this._loadTile(name, TILE)));

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = TILE;
    atlasCanvas.height = TILE * COUNT;
    const ctx = atlasCanvas.getContext('2d');
    canvases.forEach((c, i) => ctx.drawImage(c, 0, i * TILE));

    this.atlasTexture = new BABYLON.DynamicTexture(
      'blockAtlas', atlasCanvas, this.scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE
    );
    this.atlasTexture.hasAlpha = true;
    this.atlasTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

    this.opaqueMaterial = new BABYLON.StandardMaterial('terrain_opaque', this.scene);
    this.opaqueMaterial.diffuseTexture = this.atlasTexture;
    this.opaqueMaterial.backFaceCulling = true;
    this.opaqueMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    this.alphaMaterial = new BABYLON.StandardMaterial('terrain_alpha', this.scene);
    this.alphaMaterial.diffuseTexture = this.atlasTexture.clone();
    this.alphaMaterial.diffuseTexture.hasAlpha = true;
    this.alphaMaterial.backFaceCulling = false;
    this.alphaMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
    this.alphaMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  }

  async _loadTile(name, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // ZIP override takes priority
    if (this._zipOverrides.has(name)) {
      ctx.drawImage(this._zipOverrides.get(name), 0, 0, size, size);
      return canvas;
    }

    try {
      const url = `/textures/packs/${this.texturePack}/blocks/${name}.png`;
      const img = await this._loadImage(url);
      ctx.drawImage(img, 0, 0, size, size);
    } catch {
      // Magenta checkerboard for missing textures
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size / 2, size / 2);
      ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
    }

    return canvas;
  }

  _loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  getUV(textureName) {
    const layer = this.textureMap.get(textureName) ?? 0;
    const COUNT = this.textureLayers.length;
    return { u0: 0, v0: layer / COUNT, u1: 1, v1: (layer + 1) / COUNT };
  }

  getBlock(id) {
    return this.blocks.get(id) ?? this.blocks.get('air');
  }

  hasBlock(id) {
    return this.blocks.has(id);
  }
}
