import { settings } from '../core/Settings.js';

export class SettingsPanel {
  constructor(engine) {
    this.engine = engine;
    this.root   = document.getElementById('ui-root');
    this._el    = null;
    this._build();
  }

  _build() {
    this._el = document.createElement('div');
    this._el.innerHTML = `
      <style>
        #settings-panel {
          position:absolute;inset:0;display:none;align-items:center;justify-content:center;
          background:rgba(0,0,0,0.75);z-index:30;
        }
        #settings-box {
          background:#1a1a2e;border:1px solid #4fc3f7;border-radius:10px;
          padding:28px 36px;width:420px;max-height:80vh;overflow-y:auto;color:#fff;
        }
        #settings-box h2 { color:#4fc3f7;margin-bottom:20px;font-size:1.4rem; }
        .setting-row { display:flex;justify-content:space-between;align-items:center;margin:10px 0; }
        .setting-label { font-size:0.9rem;color:#ccc; }
        .setting-control input[type=range] { width:130px; }
        .setting-control input[type=text]  { width:130px;background:#111;border:1px solid #555;
          color:#fff;padding:4px 8px;border-radius:4px; }
        .setting-control input[type=checkbox] { width:18px;height:18px;cursor:pointer; }
        .setting-control select { background:#111;border:1px solid #555;color:#fff;
          padding:4px 8px;border-radius:4px; }
        #btn-close-settings { margin-top:20px;width:100%;padding:10px;background:#4fc3f7;
          border:none;color:#000;font-weight:bold;border-radius:6px;cursor:pointer;font-size:1rem; }
        #btn-reset-settings { margin-top:8px;width:100%;padding:8px;background:transparent;
          border:1px solid #c00;color:#c00;border-radius:6px;cursor:pointer;font-size:0.85rem; }
        #texture-pack-status { font-size:0.75rem;color:#4fc3f7;margin-top:4px; }
      </style>
      <div id="settings-panel">
        <div id="settings-box">
          <h2>Settings</h2>

          ${this._row('Username', `<input type="text" id="s-username" />`)}
          ${this._row('Skin Username', `<input type="text" id="s-skin" />`)}
          ${this._row('Texture Pack', `
            <div>
              <select id="s-texturepack">
                <option value="igneous">Igneous 1.19.4</option>
                <option value="vanilla">Vanilla</option>
                <option value="custom">Custom...</option>
              </select>
              <input type="file" id="s-pack-file" accept=".zip" style="display:none" />
              <div id="texture-pack-status"></div>
            </div>
          `)}
          ${this._row('FOV', `<input type="range" id="s-fov" min="50" max="120" step="1" /> <span id="s-fov-val"></span>`)}
          ${this._row('Mouse Sensitivity', `<input type="range" id="s-mouse" min="1" max="20" step="1" /> <span id="s-mouse-val"></span>`)}
          ${this._row('Render Distance', `<input type="range" id="s-rd" min="1" max="8" step="1" /> <span id="s-rd-val"></span>`)}
          ${this._row('Resolution Scale', `<input type="range" id="s-res" min="50" max="200" step="10" /> <span id="s-res-val"></span>`)}
          ${this._row('Shadows', `<input type="checkbox" id="s-shadows" />`)}
          ${this._row('Anti-Alias', `<input type="checkbox" id="s-aa" />`)}
          ${this._row('Day/Night Cycle', `<input type="checkbox" id="s-dnc" />`)}
          ${this._row('Show FPS', `<input type="checkbox" id="s-fps" />`)}
          ${this._row('Game Mode', `<select id="s-gamemode"><option value="creative">Creative</option><option value="survival">Survival</option></select>`)}
          ${this._row('Music Volume', `<input type="range" id="s-music" min="0" max="100" step="5" /> <span id="s-music-val"></span>`)}
          ${this._row('SFX Volume', `<input type="range" id="s-sfx" min="0" max="100" step="5" /> <span id="s-sfx-val"></span>`)}

          <button id="btn-close-settings">Save & Close</button>
          <button id="btn-reset-settings">Reset to Defaults</button>
        </div>
      </div>
    `;
    this.root.appendChild(this._el);
    this._bindEvents();
  }

  _row(label, control) {
    return `<div class="setting-row"><span class="setting-label">${label}</span><div class="setting-control">${control}</div></div>`;
  }

  _bindEvents() {
    const el = this._el;
    el.querySelector('#btn-close-settings').onclick = () => this._save();
    el.querySelector('#btn-reset-settings').onclick = () => { settings.reset(); this._populate(); };

    // Texture pack swap
    const packSel = el.querySelector('#s-texturepack');
    const packFile = el.querySelector('#s-pack-file');
    const packStatus = el.querySelector('#texture-pack-status');

    packSel.onchange = async () => {
      if (packSel.value === 'custom') { packFile.click(); return; }
      packStatus.textContent = 'Swapping...';
      await this.engine.reloadTexturePack(packSel.value);
      packStatus.textContent = `Loaded: ${packSel.value}`;
    };

    packFile.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      packStatus.textContent = 'Extracting...';
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const overrides = new Map();
      const tasks = [];
      zip.forEach((path, entry) => {
        if (entry.dir) return;
        const m = path.match(/(?:assets\/minecraft\/textures\/block\/|textures\/block\/|block\/|^)([^/]+\.png)$/);
        if (m) {
          tasks.push(entry.async('blob').then(b => overrides.set(m[1].replace(/\.png$/, ''), b)));
        }
      });
      await Promise.all(tasks);
      await this.engine.reloadTexturePack('custom', overrides);
      packStatus.textContent = `Loaded: ${file.name}`;
    };
  }

  _populate() {
    const q = (id) => this._el.querySelector(id);
    q('#s-username').value   = settings.get('username');
    q('#s-skin').value       = settings.get('skinUsername');
    q('#s-texturepack').value = settings.get('texturePack');
    q('#s-fov').value        = settings.get('fov');        q('#s-fov-val').textContent = settings.get('fov');
    q('#s-mouse').value      = Math.round(settings.get('mouseSensitivity') * 1000);
    q('#s-rd').value         = settings.get('renderDistance');  q('#s-rd-val').textContent = settings.get('renderDistance');
    q('#s-res').value        = Math.round(settings.get('resolutionScale') * 100); q('#s-res-val').textContent = Math.round(settings.get('resolutionScale')*100)+'%';
    q('#s-shadows').checked  = settings.get('shadows');
    q('#s-aa').checked       = settings.get('antiAlias');
    q('#s-dnc').checked      = settings.get('dayNightCycle');
    q('#s-fps').checked      = settings.get('showFPS');
    q('#s-gamemode').value   = settings.get('gameMode');
    q('#s-music').value      = Math.round(settings.get('musicVolume') * 100);
    q('#s-sfx').value        = Math.round(settings.get('sfxVolume') * 100);

    // Live slider labels
    ['fov','rd','res','music','sfx','mouse'].forEach(id => {
      const sl = q(`#s-${id}`);
      const lbl = q(`#s-${id}-val`);
      if (sl && lbl) sl.oninput = () => { lbl.textContent = sl.value + (id==='res'?'%':''); };
    });
  }

  _save() {
    const q = (id) => this._el.querySelector(id);
    settings.set('username',        q('#s-username').value.trim() || 'Player');
    settings.set('skinUsername',    q('#s-skin').value.trim());
    settings.set('texturePack',     q('#s-texturepack').value);
    settings.set('fov',             parseInt(q('#s-fov').value));
    settings.set('mouseSensitivity', parseInt(q('#s-mouse').value) / 1000);
    settings.set('renderDistance',  parseInt(q('#s-rd').value));
    settings.set('resolutionScale', parseInt(q('#s-res').value) / 100);
    settings.set('shadows',         q('#s-shadows').checked);
    settings.set('antiAlias',       q('#s-aa').checked);
    settings.set('dayNightCycle',   q('#s-dnc').checked);
    settings.set('showFPS',         q('#s-fps').checked);
    settings.set('gameMode',        q('#s-gamemode').value);
    settings.set('musicVolume',     parseInt(q('#s-music').value) / 100);
    settings.set('sfxVolume',       parseInt(q('#s-sfx').value) / 100);

    // Apply live settings — mouse sensitivity passed to controls if active
    if (this.engine.controls) {
      this.engine.controls._sensitivity = parseInt(q('#s-mouse').value) / 1000 / 100;
    }

    this.hide();
  }

  show() { this._populate(); this._el.querySelector('#settings-panel').style.display = 'flex'; }
  hide() { this._el.querySelector('#settings-panel').style.display = 'none'; }
}
