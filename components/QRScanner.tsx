import React, { useEffect, useRef, useState } from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // @ts-ignore
    if (!window.Html5Qrcode) {
      setError("Scanner library missing.");
      return;
    }

    const startCamera = async () => {
        try {
            // @ts-ignore
            const html5QrCode = new window.Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText: string) => {
                    handleSuccess(decodedText);
                },
                () => {} // Ignore frame errors
            );
        } catch (err) {
            console.error(err);
            setError("Camera access denied or unavailable.");
            setIsScanning(false);
        }
    };

    if (isScanning) {
        startCamera();
    }

    // Cleanup function strictly handles stopping the camera
    return () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current.clear();
            }).catch((err: any) => {
                // Ignore stop errors if camera wasn't running
            });
        }
    };
  }, []);

  const handleSuccess = (text: string) => {
      onScan(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      // @ts-ignore
      const html5QrCode = new window.Html5Qrcode("file-reader-placeholder");
      
      try {
          const decodedText = await html5QrCode.scanFile(file, true);
          handleSuccess(decodedText);
      } catch (err) {
          setError("No QR code found in this image.");
      }
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4"
    >
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-4 bg-gray-100 rounded-full text-gray-900 hover:bg-gray-200 transition-colors z-[101] shadow-sm"
        >
            <X size={24} />
        </button>

        <div className="w-full max-w-sm relative flex flex-col items-center">
            <h2 className="text-gray-900 text-3xl font-bold mb-8">Scan Code</h2>
            
            <div className="relative w-[300px] h-[300px] rounded-[32px] overflow-hidden bg-gray-100 shadow-xl border border-gray-200">
                {!error ? (
                     <div id="reader" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                        <AlertCircle className="w-12 h-12 mb-2 text-red-500" />
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Visual Guides */}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-xl pointer-events-none"/>
                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-xl pointer-events-none"/>
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl pointer-events-none"/>
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl pointer-events-none"/>
            </div>

            <div className="mt-10 flex gap-4 w-full">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                    <ImageIcon size={20} />
                    Upload from Gallery
                </button>
                <div id="file-reader-placeholder" className="hidden"></div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
            </div>
            
            <p className="mt-6 text-gray-400 text-sm text-center">
                Point at a Lumina QR code on another device
            </p>
        </div>
    </motion.div>
  );
};