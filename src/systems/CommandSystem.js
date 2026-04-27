/**
 * CommandSystem — parses and executes in-game slash commands.
 * Add new commands by adding to COMMANDS map below.
 */
export class CommandSystem {
  constructor(engine) {
    this.engine = engine;
  }

  execute(rawInput, sourcePlayer = null) {
    const input = rawInput.startsWith('/') ? rawInput.slice(1) : rawInput;
    const parts = input.trim().split(/\s+/);
    const cmd   = parts[0]?.toLowerCase();
    const args  = parts.slice(1);

    const handler = COMMANDS[cmd];
    if (!handler) {
      this._chat(`§cUnknown command: /${cmd}`);
      return;
    }
    try {
      handler(args, this.engine, sourcePlayer);
    } catch (err) {
      this._chat(`§cError: ${err.message}`);
    }
  }

  _chat(msg) {
    this.engine.hud?.chat?.addMessage('Server', msg);
  }
}

const COMMANDS = {
  gamemode(args, engine) {
    const mode = args[0];
    if (!['creative','survival'].includes(mode)) throw new Error('Usage: /gamemode creative|survival');
    engine.settings?.set('gameMode', mode);
    engine.player.isFlying = mode === 'creative';
    engine.player.camera.applyGravity = mode !== 'creative';
    engine.hud?.chat?.addMessage('Server', `§aGamemode set to ${mode}`);
  },

  tp(args, engine) {
    const [x, y, z] = args.map(Number);
    if ([x,y,z].some(isNaN)) throw new Error('Usage: /tp <x> <y> <z>');
    engine.player.camera.position.set(x, y, z);
  },

  give(args, engine) {
    const [blockId, countStr] = args;
    const count = parseInt(countStr) || 1;
    if (!blockId) throw new Error('Usage: /give <block> [count]');
    const player = engine.player;
    const slot = player.hotbar.findIndex(s => s === null);
    if (slot === -1) { engine.hud?.chat?.addMessage('Server', '§cHotbar full'); return; }
    player.hotbar[slot] = blockId;
    engine.hud?.updateHotbar(player.selectedSlot);
  },

  setblock(args, engine) {
    const [x, y, z, blockId] = args;
    if (!blockId) throw new Error('Usage: /setblock <x> <y> <z> <block>');
    const numId = engine.world._nameToNumericId?.get(blockId) ?? 0;
    engine.world.setBlock(parseInt(x), parseInt(y), parseInt(z), numId);
  },

  fill(args, engine) {
    const [x1,y1,z1,x2,y2,z2,blockId] = args;
    if (!blockId) throw new Error('Usage: /fill <x1> <y1> <z1> <x2> <y2> <z2> <block>');
    const numId = engine.world._nameToNumericId?.get(blockId) ?? 0;
    const [bx1,by1,bz1] = [parseInt(x1),parseInt(y1),parseInt(z1)];
    const [bx2,by2,bz2] = [parseInt(x2),parseInt(y2),parseInt(z2)];
    for (let x = Math.min(bx1,bx2); x <= Math.max(bx1,bx2); x++)
    for (let y = Math.min(by1,by2); y <= Math.max(by1,by2); y++)
    for (let z = Math.min(bz1,bz2); z <= Math.max(bz1,bz2); z++)
      engine.world.setBlock(x, y, z, numId);
  },

  clear(args, engine) { COMMANDS.fill([...args, 'air'], engine); },

  time(args, engine) {
    const [subCmd, value] = args;
    const map = { day: 0.25, noon: 0.5, dusk: 0.75, night: 0.0 };
    const t = map[value] ?? parseFloat(value);
    if (isNaN(t)) throw new Error('Usage: /time set day|noon|dusk|night|<0-1>');
    engine.dayNight?.setTime(t);
  },

  seed(args, engine) {
    engine.hud?.chat?.addMessage('Server', `§aSeed: ${engine.world?.seed}`);
  },

  summon(args, engine) {
    const [typeId, x, y, z] = args;
    if (!typeId) throw new Error('Usage: /summon <mob> [x y z]');
    const pos = engine.player.position;
    engine.entities.spawn(typeId, parseFloat(x ?? pos.x), parseFloat(y ?? pos.y), parseFloat(z ?? pos.z));
  },

  kill(args, engine) {
    for (const e of [...engine.entities.entities]) engine.entities.remove(e);
  },

  help(args, engine) {
    const list = Object.keys(COMMANDS).map(c => `/${c}`).join(', ');
    engine.hud?.chat?.addMessage('Server', `§aCommands: ${list}`);
  },
};
