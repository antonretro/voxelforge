/**
 * NetworkManager — PeerJS WebRTC peer-to-peer multiplayer.
 *
 * HOST flow:  host() → returns peerId as room code → share with friends
 * CLIENT flow: join(roomCode) → connect to host → receive world snapshot
 *
 * All messages are plain JSON:  { type, ...payload }
 */
import { RemotePlayerRenderer } from './RemotePlayerRenderer.js';

export class NetworkManager {
    constructor(engine) {
        this.engine      = engine;
        this.peer        = null;
        this.isHost      = false;
        this.hostConn    = null;           // client → host connection
        this.clientConns = new Map();      // host: peerId → DataConnection
        this.peerId      = null;

        /** @type {Map<string, {username: string, x,y,z,yaw,pitch: number}>} */
        this.players     = new Map();

        // Lazily instantiated once the renderer/scene are ready
        this._renderer   = null;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    async host() {
        const { Peer } = await import('peerjs');
        this.peer   = new Peer();
        this.isHost = true;
        return new Promise((resolve, reject) => {
            this.peer.on('open', id => {
                this.peerId = id;
                this._ensureRenderer();
                resolve(id);
            });
            this.peer.on('connection', conn => this._onClientConnect(conn));
            this.peer.on('error', reject);
        });
    }

    async join(roomCode) {
        const { Peer } = await import('peerjs');
        this.peer   = new Peer();
        this.isHost = false;
        return new Promise((resolve, reject) => {
            this.peer.on('open', () => {
                this.hostConn = this.peer.connect(roomCode, { reliable: true });
                this.hostConn.on('open', () => {
                    this._ensureRenderer();
                    this._send(this.hostConn, {
                        type:     'join',
                        username: this.engine.settings?.get('username') ?? 'Player',
                        skinId:   this.engine.settings?.get('skinUsername') ?? '',
                    });
                    resolve();
                });
                this.hostConn.on('data', msg => this._onMessage(msg, null));
                this.hostConn.on('error', reject);
            });
            this.peer.on('error', reject);
        });
    }

    broadcastBlockSet(x, y, z, id) {
        const msg = { type: 'block_set', x, y, z, id };
        if (this.isHost) this._broadcast(msg, null);
        else if (this.hostConn) this._send(this.hostConn, msg);
    }

    sendChat(message) {
        const username = this.engine.settings?.get('username') ?? 'Player';
        const msg = { type: 'chat', username, message };
        if (this.isHost) this._broadcast(msg, null);
        else if (this.hostConn) this._send(this.hostConn, msg);
    }

    isConnected() {
        return !!(this.peer && !this.peer.destroyed);
    }

    disconnect() {
        this._renderer?.dispose();
        this._renderer = null;
        this.peer?.destroy();
        this.peer        = null;
        this.hostConn    = null;
        this.clientConns.clear();
        this.players.clear();
    }

    update(_dt) {
        if (!this.peer) return;
        const now = performance.now();
        if (!this._lastPosBroadcast || now - this._lastPosBroadcast > 50) {
            this._broadcastPosition();
            this._lastPosBroadcast = now;
        }
    }

    // ── Internal ────────────────────────────────────────────────────────────

    _ensureRenderer() {
        if (!this._renderer && this.engine.solidScene) {
            this._renderer = new RemotePlayerRenderer(this.engine);
        }
    }

    _onClientConnect(conn) {
        this.clientConns.set(conn.peer, conn);
        conn.on('data',  msg => this._onMessage(msg, conn.peer));
        conn.on('close', ()  => this._handlePlayerLeave(conn.peer));
    }

    _onMessage(msg, fromPeer) {
        switch (msg.type) {

            case 'join':
                if (this.isHost) {
                    // Snapshot current world state and send to newcomer
                    const conn    = this.clientConns.get(fromPeer);
                    const changed = [...(this.engine.world?.changedBlocks?.entries() ?? [])].map(([k, v]) => {
                        const [x, y, z] = k.split(',').map(Number);
                        return { x, y, z, id: v };
                    });
                    this._send(conn, {
                        type:    'world_init',
                        seed:    this.engine.world?.seed ?? 0,
                        changed,
                    });
                    // Announce to everyone else
                    this._broadcast({ type: 'player_join', peerId: fromPeer, username: msg.username }, fromPeer);
                    this.engine.emit('chatMessage', { username: 'Server', message: `${msg.username} joined` });
                    this.players.set(fromPeer, { username: msg.username, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 });
                    this._renderer?.addPlayer(fromPeer, msg.username);
                }
                break;

            case 'player_join':
                this.players.set(msg.peerId, { username: msg.username, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 });
                this._renderer?.addPlayer(msg.peerId, msg.username);
                this.engine.emit('chatMessage', { username: 'Server', message: `${msg.username} joined` });
                break;

            case 'world_init':
                this.engine.world?.reset?.(msg.seed);
                this.engine.world?.generate?.().then(() => {
                    for (const { x, y, z, id } of msg.changed) {
                        this.engine.world?.setBlock?.(x, y, z, id, { remote: true });
                    }
                });
                break;

            case 'block_set':
                this.engine.world?.setBlock?.(msg.x, msg.y, msg.z, msg.id, { remote: true });
                if (this.isHost) this._broadcast(msg, fromPeer);
                break;

            case 'player_pos':
                this._updateRemotePlayer(msg);
                if (this.isHost) this._broadcast(msg, fromPeer);
                break;

            case 'chat':
                this.engine.emit('chatMessage', { username: msg.username, message: msg.message });
                if (this.isHost) this._broadcast(msg, fromPeer);
                break;
        }
    }

    _handlePlayerLeave(peerId) {
        const p = this.players.get(peerId);
        if (p) {
            this.engine.emit('chatMessage', { username: 'Server', message: `${p.username} left` });
        }
        this.clientConns.delete(peerId);
        this.players.delete(peerId);
        this._renderer?.removePlayer(peerId);
    }

    _updateRemotePlayer({ peerId, x, y, z, yaw, pitch }) {
        let p = this.players.get(peerId);
        if (!p) {
            p = { username: peerId, x, y, z, yaw: yaw ?? 0, pitch: pitch ?? 0 };
            this.players.set(peerId, p);
            this._renderer?.addPlayer(peerId, peerId);
        }
        Object.assign(p, { x, y, z, yaw: yaw ?? 0, pitch: pitch ?? 0 });
        this._renderer?.updatePosition(peerId, x, y, z, yaw ?? 0);
    }

    _broadcastPosition() {
        const pos = this.engine.player?.position;
        if (!pos) return;
        const msg = {
            type:   'player_pos',
            peerId: this.peerId,
            x: pos.x, y: pos.y, z: pos.z,
            yaw:   this.engine.player.yaw,
            pitch: this.engine.player.pitch,
        };
        if (this.isHost) this._broadcast(msg, null);
        else if (this.hostConn) this._send(this.hostConn, msg);
    }

    _send(conn, msg) {
        try { conn?.send(JSON.stringify(msg)); } catch { /* connection may have dropped */ }
    }

    _broadcast(msg, exceptPeer) {
        for (const [peerId, conn] of this.clientConns) {
            if (peerId !== exceptPeer) this._send(conn, msg);
        }
    }
}
