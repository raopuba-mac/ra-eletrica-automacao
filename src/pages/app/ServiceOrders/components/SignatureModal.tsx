import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { PenTool, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSignature: (signatureDataUrl: string) => void;
  initialSignature?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onOpenChange,
  onSaveSignature,
  initialSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (initialSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            setHasSignature(true);
          };
          img.src = initialSignature;
        } else {
          clearCanvas();
        }
      }
    }
  }, [isOpen, initialSignature]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    if (canvasRef.current && hasSignature) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-8 rounded-[2.5rem] bg-[#1E293B] sm:max-w-lg border-slate-800 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            <PenTool className="w-6 h-6 text-[#EAB308]" /> Assinatura Digital do Cliente
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs font-medium">
            Solicite ao cliente para assinar na área abaixo para validação e autorização do serviço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="relative bg-white rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner">
            <canvas
              ref={canvasRef}
              width={440}
              height={180}
              className="w-full h-[180px] touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
            />
            <div className="absolute bottom-2 left-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
              Assine acima
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl font-bold uppercase text-xs"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Limpar
          </Button>
          <Button
            type="button"
            disabled={!hasSignature}
            onClick={handleSave}
            className="bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase text-xs tracking-widest rounded-2xl italic"
          >
            <Check className="w-4 h-4 mr-2" /> Confirmar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
