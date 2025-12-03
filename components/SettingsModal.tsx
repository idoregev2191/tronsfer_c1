
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Shield, Sparkles, Play, ToggleRight } from 'lucide-react';
import { DevSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  onUpdateNickname: (name: string) => void;
  devSettings: DevSettings;
  onUpdateDevSettings: (settings: DevSettings) => void;
  version: string;
  playSoundPreview: (type: 'droplet' | 'success' | 'subtle') => void;
}

const ToggleRow = ({ label, description, isOn, onToggle }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100/50 last:border-0">
        <div className="flex-1 pr-4">
            <h4 className="font-medium text-[#1D1D1F] text-[15px]">{label}</h4>
            <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">{description}</p>
        </div>
        <button 
            onClick={onToggle}
            className={`w-[51px] h-[31px] rounded-full relative transition-colors duration-300 shadow-inner ${isOn ? 'bg-[#34C759]' : 'bg-[#E9E9EA]'}`}
        >
            <div className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-300 ${isOn ? 'left-[22px]' : 'left-[2px]'}`} />
        </button>
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, nickname, onUpdateNickname, devSettings, onUpdateDevSettings, 
  version, playSoundPreview
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'beta'>('general');
  
  if (!isOpen) return null;

  const updateSetting = (key: keyof DevSettings, value: any) => {
    onUpdateDevSettings({ ...devSettings, [key]: value });
  };

  const menuItems = [
      { id: 'general', label: 'General', icon: Zap },
      { id: 'privacy', label: 'Privacy', icon: Shield },
      { id: 'beta', label: 'Pro Features', icon: Sparkles },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-2xl w-full max-w-3xl h-[600px] md:h-[500px] rounded-[20px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/40 ring-1 ring-black/5"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-full md:w-[240px] bg-[#F2F2F7]/50 p-4 md:p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-200/50">
             <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl font-bold text-[#1D1D1F]">Settings</h2>
                <button onClick={onClose} className="md:hidden bg-gray-200/50 p-1 rounded-full"><X size={18}/></button>
             </div>
             
             <div className="flex gap-2 md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar">
                 {menuItems.map((item) => {
                     const Icon = item.icon;
                     const isActive = activeTab === item.id;
                     return (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)} 
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all whitespace-nowrap ${isActive ? 'bg-white shadow-sm text-[#007AFF]' : 'text-[#1D1D1F] hover:bg-white/40'}`}
                        >
                            <Icon size={18} className={isActive ? 'text-[#007AFF]' : 'text-gray-400'} /> 
                            {item.label}
                        </button>
                     );
                 })}
             </div>

             <div className="mt-auto hidden md:block pt-6">
                 <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">tRonsfer {version}</div>
             </div>
        </div>

        {/* Content Area - Fixed Scroll */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-white/40">
             <div className="absolute top-4 right-4 hidden md:block z-10">
                 <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                     <X size={16} />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                 <div className="max-w-md mx-auto">
                     {activeTab === 'general' && (
                         <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                             <h3 className="text-2xl font-bold mb-6 text-[#1D1D1F]">General</h3>
                             
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                                 <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Display Name</label>
                                 <input 
                                    value={nickname}
                                    onChange={(e) => onUpdateNickname(e.target.value)}
                                    className="w-full bg-[#F5F5F7] p-3 rounded-lg text-[#1D1D1F] font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                                    placeholder="Enter name"
                                 />
                             </div>

                             <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
                                 <ToggleRow 
                                    label="Sound Effects" 
                                    description="Audio feedback on transfer completion."
                                    isOn={devSettings.sonicPulse}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('sonicPulse', !devSettings.sonicPulse)}
                                 />
                                 {devSettings.sonicPulse && (
                                     <div className="flex gap-2 pb-4 pt-1">
                                         {['droplet', 'success', 'subtle'].map(type => (
                                             <button 
                                                key={type}
                                                // @ts-ignore
                                                onClick={() => { updateSetting('sonicPulseType', type); playSoundPreview(type); }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${devSettings.sonicPulseType === type ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                             >
                                                 {type === devSettings.sonicPulseType && <Play size={10} fill="currentColor"/>}
                                                 {type.charAt(0).toUpperCase() + type.slice(1)}
                                             </button>
                                         ))}
                                     </div>
                                 )}
                                 <ToggleRow 
                                    label="Auto Accept" 
                                    description="Skip the approval screen for incoming requests."
                                    isOn={devSettings.autoAccept}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('autoAccept', !devSettings.autoAccept)}
                                 />
                             </div>
                         </motion.div>
                     )}

                    {activeTab === 'privacy' && (
                         <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                             <h3 className="text-2xl font-bold mb-6 text-[#1D1D1F]">Privacy & Security</h3>
                             <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
                                 <ToggleRow 
                                    label="Stealth Mode" 
                                    description="Your device will not appear on other people's radar."
                                    isOn={devSettings.stealthMode}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('stealthMode', !devSettings.stealthMode)}
                                 />
                                 <ToggleRow 
                                    label="Privacy Veil" 
                                    description="Blur file names and previews in the list."
                                    isOn={devSettings.privacyVeil}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('privacyVeil', !devSettings.privacyVeil)}
                                 />
                                 <ToggleRow 
                                    label="Auto Vanish" 
                                    description="Remove files from list 60s after transfer."
                                    isOn={devSettings.autoVanish}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('autoVanish', !devSettings.autoVanish)}
                                 />
                             </div>
                         </motion.div>
                     )}

                     {activeTab === 'beta' && (
                         <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                             <h3 className="text-2xl font-bold mb-2 text-[#1D1D1F]">Pro Features</h3>
                             <p className="text-sm text-gray-500 mb-6">Enhance functionality with vC1.0 additions.</p>
                             
                             <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
                                 <ToggleRow 
                                    label="The Mesh (Shared Canvas)" 
                                    description="Files appear as a visual grid instead of a list."
                                    isOn={devSettings.sharedCanvas}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('sharedCanvas', !devSettings.sharedCanvas)}
                                 />
                                 <ToggleRow 
                                    label="Smart Compression" 
                                    description="Ask to compress large images before sending."
                                    isOn={devSettings.smartCompression}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('smartCompression', !devSettings.smartCompression)}
                                 />
                                 <ToggleRow 
                                    label="The Vault" 
                                    description="Keep a history of transfers even after disconnect."
                                    isOn={devSettings.mediaVault}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('mediaVault', !devSettings.mediaVault)}
                                 />
                                 <ToggleRow 
                                    label="Smart Continuity" 
                                    description="Automatically copy text across devices."
                                    isOn={devSettings.smartContinuity}
                                    // @ts-ignore
                                    onToggle={() => updateSetting('smartContinuity', !devSettings.smartContinuity)}
                                 />
                             </div>
                         </motion.div>
                     )}
                 </div>
             </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
