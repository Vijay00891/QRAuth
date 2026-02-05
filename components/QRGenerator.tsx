
import React, { useMemo } from 'react';
import { Download } from 'lucide-react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  label?: string;
  showDownload?: boolean;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ value, size = 128, label, showDownload = false }) => {
  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  }, [value, size]);

  const handleDownload = async () => {
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${label || value}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-2 rounded-lg border border-slate-200 inline-block shadow-sm">
        <img 
          src={qrUrl} 
          alt="Product QR Code" 
          width={size} 
          height={size}
          className="block"
        />
      </div>
      {showDownload && (
        <button 
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
        >
          <Download size={12} /> Download Label
        </button>
      )}
    </div>
  );
};

export default QRGenerator;
