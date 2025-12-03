
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Copy, Check, ShieldCheck, 
  ArrowRight, Plus, Send, Smartphone, Settings, AlertTriangle, Archive, Grid as GridIcon, List as ListIcon, X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import { Button } from './components/Button';
import { FilePreview } from './components/FilePreview';
import { Radar } from './components/Radar';
import { FullScreenPreview } from './components/FullScreenPreview';
import { SettingsModal } from './components/SettingsModal';
import { ConnectionStatus, FileMeta, PeerUser, DevSettings, TronsferID } from './types';
import { DiscoveryService } from './services/discoveryService';
import { compressImage } from './services/compressionService';

const APP_ID_PREFIX = 'lumina-drop-';
const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Sound Synthesizer
const playSound = (type: 'droplet' | 'success' | 'subtle') => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const t = ctx.currentTime;

        if (type === 'droplet') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, t); 
            osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.1); 
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
        } else if (type === 'subtle') {
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(200, t);
             gain.gain.setValueAtTime(0.05, t);
             gain.gain.linearRampToValueAtTime(0, t + 0.2);
             osc.start(t);
             osc.stop(t + 0.2);
        }
    } catch(e) {}
};

function App() {
  const getDeviceVersion = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = /iPad/i.test(navigator.userAgent);
    const type = isTablet ? 't' : (isMobile ? 'p' : 'm');
    const optimized = 'y'; 
    return `C${type}${optimized}1.0`;
  };
  const APP_VERSION_STRING = getDeviceVersion();
  const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // --- State ---
  const [hasSetup, setHasSetup] = useState(false);
  const [nickname, setNickname] = useState('');
  
  const [myId, setMyId] = useState<string>('');
  
  const [peerInstance, setPeerInstance] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [requester, setRequester] = useState<{id: string, nickname: string, version?: string} | null>(null);
  
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [activeFilePreview, setActiveFilePreview] = useState<FileMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [nearbyPeers, setNearbyPeers] = useState<PeerUser[]>([]);
  
  const [manualCode, setManualCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false); 
  
  // vC1.0 States
  const [showVault, setShowVault] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<FileMeta[]>([]);
  const [pendingCompression, setPendingCompression] = useState<{file: File, id: string} | null>(null);

  const [devSettings, setDevSettings] = useState<DevSettings>({
      autoAccept: false,
      debugOverlay: false,
      privacyVeil: false,
      e2eEncryption: false,
      stealthMode: false,
      sonicPulse: true,
      sonicPulseType: 'droplet',
      // C1.0 Features
      sharedCanvas: false,
      mediaVault: false,
      smartContinuity: false,
      smartCompression: false,
      // Legacy
      infinityLink: false,
      autoVanish: false,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const discoveryService = useRef<DiscoveryService | null>(null);
  const wakeLockRef = useRef<any>(null);

  // --- Vault Persistence ---
  useEffect(() => {
      const savedVault = localStorage.getItem('tronsfer_vault');
      if (savedVault) {
          try { setVaultFiles(JSON.parse(savedVault)); } catch(e) {}
      }
  }, []);

  const addToVault = (file: FileMeta) => {
      if (!devSettings.mediaVault) return;
      // We can't store Blobs in localStorage, so we mock it with meta data
      const safeFile = { ...file, blob: undefined, url: undefined };
      setVaultFiles(prev => {
          const next = [safeFile, ...prev];
          localStorage.setItem('tronsfer_vault', JSON.stringify(next));
          return next;
      });
  };

  // --- Wake Lock ---
  useEffect(() => {
    if (devSettings.infinityLink) {
        if ('wakeLock' in navigator) {
            // @ts-ignore
            navigator.wakeLock.request('screen')
                .then((lock: any) => { wakeLockRef.current = lock; })
                .catch((e: any) => console.log('Wake Lock denied', e));
        }
    } else {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    }
  }, [devSettings.infinityLink]);

  // --- Init ---
  useEffect(() => {
    let shortId = generateShortId();
    setMyId(shortId);

    const savedNick = localStorage.getItem('tronsfer_nickname');
    if (savedNick) {
        setNickname(savedNick);
        setHasSetup(true);
        const checkPeer = setInterval(() => {
            // @ts-ignore
            if (window.Peer) {
                clearInterval(checkPeer);
                startServices(savedNick, shortId);
            }
        }, 500);
        return () => clearInterval(checkPeer);
    }
  }, []);

  // Restart Discovery Logic
  useEffect(() => {
      if (hasSetup && discoveryService.current) {
          discoveryService.current.disconnect();
          if (!devSettings.stealthMode) {
             discoveryService.current = new DiscoveryService(myId, nickname, (peers) => {
                 setNearbyPeers(peers);
             });
             discoveryService.current.connect();
          }
      }
  }, [devSettings.stealthMode, nickname]);

  const completeSetup = () => {
      const finalNick = nickname.trim() || `User ${myId}`;
      setNickname(finalNick);
      localStorage.setItem('tronsfer_nickname', finalNick);
      setHasSetup(true);
      startServices(finalNick, myId);
  };

  const startServices = (nick: string, id: string) => {
    if (!devSettings.stealthMode) {
        discoveryService.current = new DiscoveryService(id, nick, (peers) => {
            setNearbyPeers(peers);
        });
        discoveryService.current.connect();
    }

    try {
        // @ts-ignore
        const peer = new window.Peer(`${APP_ID_PREFIX}${id}`);
        
        peer.on('connection', (connection: any) => {
            connection.on('data', (data: any) => {
                if (data.type === 'connection-request') {
                    if (devSettings.autoAccept) {
                         connection.send({ type: 'connection-accepted', info: { version: APP_VERSION_STRING } });
                         setStatus(ConnectionStatus.CONNECTED);
                         setRequester(data.info);
                         setConn(connection);
                    } else {
                        setRequester(data.info);
                        setStatus(ConnectionStatus.INCOMING_REQUEST);
                        setConn(connection);
                    }
                } else if (data.type === 'disconnect') {
                    handleRemoteDisconnect();
                } else {
                    handleIncomingData(data);
                }
            });
            connection.on('close', handleRemoteDisconnect);
        });

        peer.on('error', (err: any) => {
            if (err.type === 'unavailable-id') {
                 const newId = generateShortId();
                 setMyId(newId);
                 startServices(nick, newId);
            } else {
                setErrorMsg("Connection Error");
                setTimeout(() => setErrorMsg(''), 4000);
            }
        });

        setPeerInstance(peer);
    } catch (e) {
        console.error("PeerJS init failed", e);
    }
  };

  useEffect(() => {
    return () => {
      if (peerInstance) peerInstance.destroy();
      discoveryService.current?.disconnect();
    };
  }, []);

  const initiateConnection = (targetId: string, targetNick: string) => {
      if (!peerInstance || targetId === myId) return;
      setStatus(ConnectionStatus.REQUESTING);
      const fullId = `${APP_ID_PREFIX}${targetId}`;
      
      try {
          const connection = peerInstance.connect(fullId, { serialization: 'binary' });
          connection.on('open', () => {
              setConn(connection);
              connection.send({
                  type: 'connection-request',
                  info: { id: myId, nickname: nickname, version: APP_VERSION_STRING }
              });
          });

          connection.on('data', (data: any) => {
              if (data.type === 'connection-accepted') {
                  setStatus(ConnectionStatus.CONNECTED);
                  setRequester({ id: targetId, nickname: targetNick, version: data.info?.version });
              } else if (data.type === 'connection-rejected') {
                  handleRemoteDisconnect();
                  setErrorMsg("Connection Rejected");
                  setTimeout(() => setErrorMsg(''), 3000);
              } else if (data.type === 'disconnect') {
                  handleRemoteDisconnect();
              } else {
                  handleIncomingData(data);
              }
          });
          
          connection.on('close', handleRemoteDisconnect);
      } catch (e) {
          setErrorMsg("Connection Failed");
          setStatus(ConnectionStatus.DISCONNECTED);
      }
  };

  const acceptConnection = () => {
      if (!conn) return;
      conn.send({ type: 'connection-accepted', info: { version: APP_VERSION_STRING } });
      setStatus(ConnectionStatus.CONNECTED);
  };

  const rejectConnection = () => {
      if (!conn) return;
      conn.send({ type: 'connection-rejected' });
      conn.close();
      setRequester(null);
      setStatus(ConnectionStatus.DISCONNECTED);
  };

  const handleRemoteDisconnect = () => {
    setStatus(ConnectionStatus.DISCONNECTED);
    setConn(null);
    setRequester(null);
    setFiles([]); 
  };

  const disconnect = () => {
      if (conn) {
          try { conn.send({ type: 'disconnect' }); } catch(e) {}
          conn.close();
      }
      handleRemoteDisconnect();
  };

  const handleIncomingData = (data: any) => {
    if (data.type === 'file-meta') {
      setFiles(prev => [{
        id: data.id,
        name: data.name,
        size: data.size,
        type: data.mime,
        progress: 0,
        direction: 'incoming',
        startTime: Date.now()
      }, ...prev]);
    } else if (data.type === 'file-full') {
        const blob = new Blob([new Uint8Array(data.buffer)], { type: data.mime });
        const url = URL.createObjectURL(blob);
        
        if (devSettings.sonicPulse) playSound(devSettings.sonicPulseType);
        
        setFiles(prev => {
            const newFiles = prev.map(f => {
                if (f.id === data.id) {
                    const completeFile = { ...f, progress: 100, blob, url, timeRemaining: undefined };
                    addToVault(completeFile);
                    return completeFile;
                }
                return f;
            });
            return newFiles;
        });

        if (devSettings.autoVanish) {
            setTimeout(() => {
                setFiles(prev => prev.filter(f => f.id !== data.id));
            }, 60000);
        }
    }
  };

  const prepareFileSend = (file: File) => {
      const fileId = uuidv4();
      
      // Smart Compression Check
      if (devSettings.smartCompression && file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
          setPendingCompression({ file, id: fileId });
      } else {
          startTransfer(file, fileId);
      }
  };

  const handleCompressionChoice = async (compress: boolean) => {
      if (!pendingCompression) return;
      const { file, id } = pendingCompression;
      setPendingCompression(null);

      if (compress) {
          try {
              const compressedBlob = await compressImage(file);
              // Convert blob back to file-like object for transfer logic (keep name)
              const compressedFile = new File([compressedBlob], file.name, { type: file.type });
              startTransfer(compressedFile, id);
          } catch(e) {
              console.error("Compression failed", e);
              startTransfer(file, id); // Fallback
          }
      } else {
          startTransfer(file, id);
      }
  };

  const startTransfer = (file: File, fileId: string) => {
    if (!conn) return;

    const newFile: FileMeta = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        direction: 'outgoing',
        startTime: Date.now()
    };
    setFiles(prev => [newFile, ...prev]);
    addToVault(newFile);
    
    conn.send({ type: 'file-meta', id: fileId, name: file.name, size: file.size, mime: file.type });
    
    const reader = new FileReader();
    reader.onload = (e) => {
        if (e.target?.result) {
            const buffer = e.target.result;
            conn.send({ type: 'file-full', id: fileId, mime: file.type, buffer: buffer });
            if (devSettings.sonicPulse) playSound(devSettings.sonicPulseType);
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 100 } : f));
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(myId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- Views ---

  if (!hasSetup) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F5F5F7]">
             <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="max-w-md w-full">
                 <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                     <Zap size={32} />
                 </div>
                 <h1 className="text-3xl font-bold mb-2 tracking-tight text-[#1D1D1F]">Welcome to tRonsfer</h1>
                 <p className="text-gray-500 mb-8">Choose how you appear to others.</p>
                 <input 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Your Nickname"
                    className="w-full bg-white p-4 rounded-2xl text-center text-xl font-medium shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-black"
                    maxLength={15}
                 />
                 <Button onClick={completeSetup} disabled={!nickname.trim()} className="w-full rounded-2xl py-4 bg-[#007AFF] text-white">
                     Continue
                 </Button>
             </motion.div>
        </div>
      );
  }

  const shouldHideRadarOnMobile = IS_MOBILE && status === ConnectionStatus.CONNECTED;

  return (
    <div 
        className={`min-h-screen overflow-hidden flex flex-col items-center relative bg-[#F5F5F7] text-[#1D1D1F] transition-all duration-500`}
        onDragEnter={() => setIsFocusMode(true)}
        onDragLeave={() => setIsFocusMode(false)}
        onDrop={() => setIsFocusMode(false)}
    >
        <input type="file" multiple ref={fileInputRef} onChange={(e) => {
             if (e.target.files) Array.from(e.target.files).forEach(prepareFileSend);
             e.target.value = '';
        }} className="hidden" />

        <div className={`w-full max-w-[1200px] px-6 pt-6 pb-2 flex items-center justify-between z-20 ${shouldHideRadarOnMobile ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md bg-black text-white">
                    <Zap size={16} />
                </div>
                <span className="font-bold text-lg tracking-tight">tRonsfer</span>
            </div>
            <div className="flex gap-2">
                {devSettings.mediaVault && (
                    <Button variant="icon" active={showVault} onClick={() => setShowVault(!showVault)} icon={<Archive size={20}/>} />
                )}
                <Button variant="icon" active={showSettings} onClick={() => setShowSettings(true)} icon={<Settings size={20}/>} />
            </div>
        </div>

        <AnimatePresence>
            {errorMsg && (
                <motion.div initial={{y:-50, opacity:0}} animate={{y:0, opacity:1}} exit={{y:-50, opacity:0}} className="fixed top-6 left-0 right-0 z-[200] flex justify-center pointer-events-none">
                    <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2">
                        <AlertTriangle size={16}/> {errorMsg}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Vault Overlay */}
        <AnimatePresence>
            {showVault && (
                <motion.div 
                    initial={{opacity: 0, scale: 0.95}} 
                    animate={{opacity: 1, scale: 1}} 
                    exit={{opacity: 0, scale: 0.95}}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex flex-col p-8"
                >
                    <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                        <h2 className="text-3xl font-bold text-[#1D1D1F]">The Vault</h2>
                        <button onClick={() => setShowVault(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {vaultFiles.map((f, i) => (
                                <div key={i} className="aspect-square bg-[#F5F5F7] rounded-2xl flex flex-col items-center justify-center border border-white p-4 shadow-sm hover:scale-105 transition-transform">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                        <span className="text-xs font-bold text-gray-500">{f.type.split('/')[1]?.toUpperCase().substring(0,3)}</span>
                                    </div>
                                    <span className="font-semibold text-sm truncate w-full text-center text-gray-700">{f.name}</span>
                                </div>
                            ))}
                        </div>
                        {vaultFiles.length === 0 && (
                            <div className="text-center text-gray-400 mt-20">Vault is empty.</div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Smart Compression Dialog */}
        <AnimatePresence>
            {pendingCompression && (
                <motion.div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
                             <GridIcon size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Large Image Detected</h3>
                        <p className="text-gray-500 mb-6 text-sm">Use Smart Compression to send this faster?</p>
                        <div className="flex gap-3">
                            <button onClick={() => handleCompressionChoice(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-700">Original</button>
                            <button onClick={() => handleCompressionChoice(true)} className="flex-1 py-3 bg-[#007AFF] rounded-xl font-bold text-white shadow-lg shadow-blue-500/30">Compress</button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex-1 w-full max-w-[1200px] px-4 py-2 flex flex-col min-h-0 relative z-10">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0">
                
                <div className={`md:col-span-5 lg:col-span-4 flex flex-col h-full gap-4 ${shouldHideRadarOnMobile ? 'hidden md:flex' : 'flex'}`}>
                    <div className={`flex-1 rounded-[32px] shadow-sm border border-white/60 p-6 flex flex-col relative overflow-hidden bg-white/80 backdrop-blur-md`}>
                        <div className="flex items-center justify-between mb-4 z-10 relative">
                            <h2 className="text-xl font-bold tracking-tight">Nearby</h2>
                        </div>
                        <div className={`flex-1 relative min-h-[250px] rounded-[24px] overflow-hidden bg-[#F9F9FB]/50 border border-gray-100/50`}>
                             <Radar 
                                peers={nearbyPeers} 
                                myNickname={nickname} 
                                onConnect={(p) => initiateConnection(p.id, p.nickname)} 
                             />
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-[32px] shadow-sm border border-white/60 p-2 flex flex-col gap-2">
                         <div 
                                onClick={copyToClipboard}
                                className="rounded-[24px] py-4 px-6 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform bg-gray-50 border border-gray-100"
                            >
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">MY ID</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-2xl font-mono font-bold tracking-widest text-[#007AFF]`}>{myId}</span>
                                    {copied ? <Check size={16} className="text-green-500"/> : <Copy size={14} className="text-gray-300"/>}
                                </div>
                        </div>
                        <div className="rounded-[24px] p-2 flex items-center bg-white border border-gray-100">
                                <input 
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER CODE"
                                    maxLength={8}
                                    className="flex-1 h-full px-4 text-center font-mono text-lg font-bold outline-none uppercase placeholder:text-gray-300 bg-transparent text-black"
                                />
                                <button 
                                    onClick={() => initiateConnection(manualCode, 'Unknown')}
                                    disabled={manualCode.length < 3}
                                    className="w-12 h-12 rounded-[20px] flex items-center justify-center disabled:opacity-20 active:scale-95 transition-all shadow-lg bg-black text-white"
                                >
                                    <ArrowRight size={20} />
                                </button>
                        </div>
                    </div>
                </div>

                <div className={`md:col-span-7 lg:col-span-8 flex flex-col h-full bg-white/90 backdrop-blur-xl rounded-[32px] shadow-sm border border-white/60 relative overflow-hidden ${shouldHideRadarOnMobile ? 'h-[100dvh] fixed inset-0 z-50 rounded-none' : ''}`}>
                    {status === ConnectionStatus.DISCONNECTED ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-40 pointer-events-none">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Send size={40} className="text-gray-300"/>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Ready to Transfer</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2">Connect to a device from the radar or enter a code.</p>
                        </div>
                    ) : status === ConnectionStatus.REQUESTING ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50"/>
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center relative z-10 text-blue-500">
                                    <Smartphone size={32} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Connecting...</h3>
                            <button onClick={disconnect} className="mt-8 px-6 py-2 bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full w-full">
                            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between safe-top">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                                         {devSettings.e2eEncryption ? <ShieldCheck size={24} /> : <Check size={24} />}
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-xl text-gray-900">{requester?.nickname}</h3>
                                         <div className="flex items-center gap-2">
                                             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Connected</span>
                                         </div>
                                     </div>
                                </div>
                                <button onClick={disconnect} className="px-5 py-2 bg-gray-50 rounded-full text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                                     Disconnect
                                </button>
                            </div>

                            {/* Shared Canvas (The Mesh) or List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#F9F9FB]/50">
                                {files.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <p className="font-medium text-lg text-gray-900">No files shared yet</p>
                                    </div>
                                )}
                                
                                {devSettings.sharedCanvas ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {files.map(f => (
                                            <div 
                                                key={f.id} 
                                                onClick={() => f.progress === 100 && setActiveFilePreview(f)} 
                                                className="bg-white aspect-square rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                            >
                                                <div className="w-12 h-12 bg-gray-50 rounded-full mb-2 flex items-center justify-center text-blue-500 font-bold text-xs border border-gray-100">
                                                    {f.type.split('/')[1]?.substring(0,3).toUpperCase()}
                                                </div>
                                                <p className="text-xs font-bold text-center w-full px-2 truncate">{f.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    files.map(f => (
                                        <div key={f.id} onClick={() => f.progress === 100 && setActiveFilePreview(f)} className="cursor-pointer active:scale-[0.99] transition-transform">
                                            <FilePreview file={f} privacyMode={devSettings.privacyVeil} />
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white safe-bottom">
                                 <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 bg-[#007AFF] text-white rounded-[20px] font-bold text-lg hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                 >
                                     <Plus size={24} /> Send File
                                 </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>

        <div className={`py-4 text-center z-20 ${shouldHideRadarOnMobile ? 'hidden' : 'block'}`}>
             <span className="text-[10px] font-mono px-3 py-1 rounded-full shadow-sm bg-white/50 text-gray-400 border border-white/20">{APP_VERSION_STRING}</span>
        </div>

        <AnimatePresence>
            {showSettings && (
                <SettingsModal 
                    isOpen={showSettings} 
                    onClose={() => setShowSettings(false)}
                    nickname={nickname}
                    onUpdateNickname={(n) => { setNickname(n); localStorage.setItem('tronsfer_nickname', n); }}
                    devSettings={devSettings}
                    onUpdateDevSettings={setDevSettings}
                    version={APP_VERSION_STRING}
                    playSoundPreview={playSound}
                />
            )}

            {activeFilePreview && (
                <FullScreenPreview file={activeFilePreview} onClose={() => setActiveFilePreview(null)} />
            )}
            
            {status === ConnectionStatus.INCOMING_REQUEST && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-6"
                >
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }}
                        className="bg-[#F2F2F7] rounded-t-[32px] sm:rounded-[32px] p-8 w-full max-w-sm text-center shadow-2xl overflow-hidden relative"
                    >
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md text-blue-500 relative z-10">
                            <Smartphone size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{requester?.nickname}</h3>
                        <p className="text-gray-500 mb-8 font-medium">wants to connect</p>
                        
                        <div className="flex gap-3 relative z-10">
                            <button onClick={rejectConnection} className="flex-1 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-50 shadow-sm border border-gray-100">Decline</button>
                            <button onClick={acceptConnection} className="flex-1 py-4 bg-[#007AFF] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600">Accept</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}

export default App;
