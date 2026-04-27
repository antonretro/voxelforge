/**
 * InputManager — unified keyboard / mouse / touch / gamepad input.
 * Everything reads from this one source of truth each frame.
 */
export class InputManager {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.engine = engine;

    this.keys = new Set();
    this.mouse = { dx: 0, dy: 0, buttons: [false, false, false], locked: false };
    this.scroll = 0;
    this.touch = { joystick: { x: 0, y: 0 }, look: { dx: 0, dy: 0 } };
    this.gamepad = null;
    this._prevGamepad = null;

    this._bind();
  }

  _bind() {
    const c = this.canvas;

    // Keyboard
    window.addEventListener('keydown', e => { this.keys.add(e.code); e.preventDefault(); });
    window.addEventListener('keyup',   e => this.keys.delete(e.code));

    // Mouse
    window.addEventListener('mousemove', e => {
      if (this.mouse.locked) {
        this.mouse.dx += e.movementX;
        this.mouse.dy += e.movementY;
      }
    });
    c.addEventListener('mousedown', e => { this.mouse.buttons[e.button] = true; });
    window.addEventListener('mouseup',   e => { this.mouse.buttons[e.button] = false; });
    c.addEventListener('wheel', e => { this.scroll += Math.sign(e.deltaY); }, { passive: true });

    // Pointer lock
    c.addEventListener('click', () => { if (!this.mouse.locked) c.requestPointerLock(); });
    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = document.pointerLockElement === c;
    });

    // Gamepad
    window.addEventListener('gamepadconnected',    e => { this.gamepad = e.gamepad; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepad = null; });

    // Prevent context menu
    c.addEventListener('contextmenu', e => e.preventDefault());
  }

  update() {
    // Poll gamepad (browsers require re-querying each frame)
    if (this.gamepad) {
      const pads = navigator.getGamepads();
      this.gamepad = pads[this.gamepad.index] || this.gamepad;
    }
    // Scroll resets each frame
    this._frameScroll = this.scroll;
    this.scroll = 0;
  }

  // --- Accessors ---

  isDown(code) { return this.keys.has(code); }

  get moveX() {
    let v = 0;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) v += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft'))  v -= 1;
    if (this.gamepad) v += this._deadzone(this.gamepad.axes[0]);
    return v;
  }

  get moveZ() {
    let v = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp'))   v += 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) v -= 1;
    if (this.gamepad) v += this._deadzone(this.gamepad.axes[1]);
    return v;
  }

  get jump() {
    return this.isDown('Space') || (this.gamepad?.buttons[0]?.pressed ?? false);
  }

  get sprint() {
    return this.isDown('ShiftLeft') || (this.gamepad?.buttons[10]?.pressed ?? false);
  }

  get sneak() {
    return this.isDown('ControlLeft') || (this.gamepad?.buttons[11]?.pressed ?? false);
  }

  get breakBlock() {
    return this.mouse.buttons[0] || (this.gamepad?.buttons[7]?.value > 0.5 ?? false);
  }

  get placeBlock() {
    return this.mouse.buttons[2] || (this.gamepad?.buttons[6]?.value > 0.5 ?? false);
  }

  get lookDX() {
    let v = this.mouse.dx;
    if (this.gamepad) v += this._deadzone(this.gamepad.axes[2]) * 6;
    this.mouse.dx = 0;
    return v;
  }

  get lookDY() {
    let v = this.mouse.dy;
    if (this.gamepad) v += this._deadzone(this.gamepad.axes[3]) * 6;
    this.mouse.dy = 0;
    return v;
  }

  get scrollDelta() { return this._frameScroll || 0; }

  _deadzone(v, threshold = 0.15) {
    return Math.abs(v) < threshold ? 0 : v;
  }

  consumeMouse() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }
}
