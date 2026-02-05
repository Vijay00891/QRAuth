
import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCcw, XCircle } from 'lucide-react';

interface ScannerProps {
  onScan: (token: string) => void;
  onClose: () => void;
}

declare const jsQR: any;

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          setIsScanning(true);
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setError('Camera access denied or not available.');
      }
    }

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code) {
              onScan(code.data);
              return; // Stop scanning after successful scan
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onScan]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
      <canvas ref={canvasRef} className="hidden" />
      {error ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white">
          <XCircle className="text-rose-500 mb-4" size={48} />
          <p className="font-medium">{error}</p>
          <button onClick={onClose} className="mt-6 bg-white/10 px-4 py-2 rounded-lg text-sm">Go Back</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-2xl">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium">
                <Camera size={16} className="text-blue-400" />
                Point at QR Code
              </div>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }`}</style>
    </div>
  );
};

export default Scanner;
