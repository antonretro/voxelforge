export class MiniMap {
  constructor(engine) {
    this.engine = engine;
    this.visible = true;
    this.accumulator = 0;
    this.radius = 24;
    this.cells = 32;

    this.colors = {
      'grass': '#5c914d',
      'dirt': '#6b5138',
      'stone': '#636c75',
      'sand': '#bdae76',
      'water': '#3459a8',
      'oak_log': '#75573a',
      'oak_leaves': '#32713c',
      'iron_ore': '#a1a1a8',
      'gold_ore': '#d4bb3d',
      'diamond_ore': '#5dc8bf',
      'coal_ore': '#3a3d45',
      'bedrock': '#1f1f1f',
    };
  }

  attachDom(container, canvas) {
    this.container = container;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  update(dt, playerPos, yaw) {
    if (!this.visible || !this.ctx || !playerPos || !this.engine.world) return;

    this.accumulator += dt;
    if (this.accumulator < 0.1) return; // Update at ~10 FPS for performance
    this.accumulator = 0;

    const ctx = this.ctx;
    const size = this.canvas.width;
    const cells = this.cells;
    const cellSize = size / cells;
    
    const startX = Math.floor(playerPos.x - cells / 2);
    const startZ = Math.floor(playerPos.z - cells / 2);

    // Background
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, size, size);

    // Draw blocks
    for (let z = 0; z < cells; z++) {
      for (let x = 0; x < cells; x++) {
        const wx = startX + x;
        const wz = startZ + z;
        
        const h = this.engine.world.getHeight(wx, wz);
        if (h > 0) {
            const blockId = this.engine.world.getBlock(wx, h - 1, wz);
            // In current project, blockId is numeric. We need a way to map it to color.
            // For now, let's use a simple mapping or just use a default color.
            ctx.fillStyle = this._getColor(blockId);
            ctx.fillRect(x * cellSize, z * cellSize, Math.ceil(cellSize), Math.ceil(cellSize));
        }
      }
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);

    // Player arrow
    const c = size / 2;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _getColor(id) {
    // Numeric IDs in current project: 1=air, 2=stone, 3=grass, 4=dirt, etc.
    // I'll map some common ones
    switch(id) {
        case 2: return '#636c75'; // stone
        case 3: return '#5c914d'; // grass
        case 4: return '#6b5138'; // dirt
        case 5: return '#bdae76'; // sand
        case 6: return '#3459a8'; // water
        default: return id > 1 ? '#444' : '#05070b';
    }
  }
}
