
export interface PeerUser {
  id: string;
  nickname: string;
  platform: 'mobile' | 'desktop';
  version?: string;
  lastSeen?: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  REQUESTING = 'REQUESTING',
  INCOMING_REQUEST = 'INCOMING_REQUEST',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0 to 100
  blob?: Blob;
  url?: string;
  direction: 'incoming' | 'outgoing';
  startTime?: number;
  timeRemaining?: string;
  speed?: string;
  // Mesh Coordinates
  x?: number;
  y?: number;
}

export interface TronsferID {
  username: string;
  registeredAt: number;
  history: Array<{ peerId: string, timestamp: number, nickname: string }>;
}

export interface CloudUser {
  id: string;
  username: string;
  created_at: string;
}

export interface DevSettings {
  // General
  sonicPulse: boolean;       
  sonicPulseType: 'droplet' | 'success' | 'subtle'; 
  autoAccept: boolean;
  
  // Privacy
  privacyVeil: boolean;      
  e2eEncryption: boolean;    
  stealthMode: boolean;      
  
  // vC1.0 Features
  sharedCanvas: boolean;     // The Mesh (Grid)
  mediaVault: boolean;       // Persistent Gallery
  smartContinuity: boolean;  // Auto-sync
  smartCompression: boolean; // Actual Image Compression
  
  // Legacy
  infinityLink: boolean;
  autoVanish: boolean;
  debugOverlay: boolean;
}

declare global {
  interface Window {
    Peer: any;
  }
}