// Reliable Discovery Service using EMQX Public Cloud Broker
import { PeerUser } from '../types';

type PeerUpdateCallback = (peers: PeerUser[]) => void;

export class DiscoveryService {
  private client: any = null;
  private myId: string;
  private myNickname: string;
  private onPeersUpdate: PeerUpdateCallback;
  private peers: Map<string, PeerUser> = new Map(); // ID -> PeerUser
  private broadcastInterval: any = null;
  private cleanupInterval: any = null;

  private readonly BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
  private readonly TOPIC = 'lumina-app/v5/radar/presence'; // v5 channel

  constructor(myId: string, myNickname: string, onPeersUpdate: PeerUpdateCallback) {
    this.myId = myId;
    this.myNickname = myNickname;
    this.onPeersUpdate = onPeersUpdate;
  }

  public connect() {
    try {
      // @ts-ignore
      if (!window.mqtt) {
        console.warn("MQTT library not loaded");
        return;
      }

      // @ts-ignore
      this.client = window.mqtt.connect(this.BROKER_URL, {
        keepalive: 60,
        clientId: 'lumina_' + Math.random().toString(16).substr(2, 8),
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        path: '/mqtt'
      });

      this.client.on('connect', () => {
        this.client.subscribe(this.TOPIC, (err: any) => {
          if (!err) {
            this.startBroadcasting();
          }
        });
      });

      this.client.on('message', (topic: string, message: any) => {
        if (topic === this.TOPIC) {
          try {
            const textMsg = message.toString();
            const payload = JSON.parse(textMsg);
            
            if (payload.id && payload.id !== this.myId) {
              this.peers.set(payload.id, {
                id: payload.id,
                nickname: payload.nickname || 'Unknown',
                platform: payload.platform || 'desktop',
                lastSeen: Date.now()
              });
              this.updatePeerList();
            }
          } catch (e) {}
        }
      });

      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        let changed = false;
        this.peers.forEach((peer, id) => {
          if (peer.lastSeen && now - peer.lastSeen > 12000) {
            this.peers.delete(id);
            changed = true;
          }
        });
        if (changed) this.updatePeerList();
      }, 4000);

    } catch (e) {
      console.warn('Discovery error', e);
    }
  }

  private startBroadcasting() {
    this.broadcast();
    this.broadcastInterval = setInterval(() => this.broadcast(), 3000);
  }

  private broadcast() {
    if (this.client && this.client.connected) {
      const payload = JSON.stringify({
        id: this.myId,
        nickname: this.myNickname,
        ts: Date.now(),
        platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
      this.client.publish(this.TOPIC, payload);
    }
  }

  private updatePeerList() {
    const activePeers = Array.from(this.peers.values());
    this.onPeersUpdate(activePeers);
  }

  public disconnect() {
    if (this.broadcastInterval) clearInterval(this.broadcastInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.client) {
      try { this.client.end(); } catch (e) {}
      this.client = null;
    }
  }
}