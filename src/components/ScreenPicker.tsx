import { useState, useRef, useCallback, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ScreenPickerProps {
  onImageCaptured: (blob: Blob) => void;
}

export const ScreenPicker = ({ onImageCaptured }: ScreenPickerProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [selection, setSelection] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          
          // Wait a bit for the video to render, then capture frame
          setTimeout(() => {
            captureFrame();
          }, 500);
        };
      }
    } catch (err) {
      console.error('Error accessing screen:', err);
      toast.error('Could not access screen. Please allow screen sharing.');
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const frameData = canvas.toDataURL('image/png');
      setCapturedFrame(frameData);
      setIsCapturing(true);
      
      // Stop the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setSelection({ startX: x, startY: y, endX: x, endY: y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !selection) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setSelection({ ...selection, endX: x, endY: y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !selection) return;
    setIsDrawing(false);
    
    // Ensure selection has valid dimensions
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);
    
    if (width < 10 || height < 10) {
      toast.error('Selection too small. Please draw a larger region.');
      setSelection(null);
      return;
    }
    
    cropAndExport();
  };

  const cropAndExport = () => {
    if (!capturedFrame || !selection || !canvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const cropCanvas = document.createElement('canvas');
      const x = Math.min(selection.startX, selection.endX);
      const y = Math.min(selection.startY, selection.endY);
      const width = Math.abs(selection.endX - selection.startX);
      const height = Math.abs(selection.endY - selection.startY);
      
      cropCanvas.width = width;
      cropCanvas.height = height;
      
      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
        
        cropCanvas.toBlob((blob) => {
          if (blob) {
            onImageCaptured(blob);
            handleCancel();
          }
        }, 'image/png');
      }
    };
    img.src = capturedFrame;
  };

  const handleCancel = () => {
    setIsCapturing(false);
    setCapturedFrame(null);
    setSelection(null);
    setIsDrawing(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCapturing) {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isCapturing]);

  useEffect(() => {
    if (capturedFrame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Draw the captured frame
          ctx.drawImage(img, 0, 0);
          
          // Draw selection overlay
          if (selection) {
            const x = Math.min(selection.startX, selection.endX);
            const y = Math.min(selection.startY, selection.endY);
            const width = Math.abs(selection.endX - selection.startX);
            const height = Math.abs(selection.endY - selection.startY);
            
            // Darken everything
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Clear selection area
            ctx.clearRect(x, y, width, height);
            ctx.drawImage(img, x, y, width, height, x, y, width, height);
            
            // Draw selection border
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
          }
        }
      };
      
      img.src = capturedFrame;
    }
  }, [capturedFrame, selection]);

  return (
    <div className="space-y-4">
      {!isCapturing ? (
        <Button
          onClick={startCapture}
          variant="outline"
          className="w-full"
        >
          <Monitor className="mr-2 h-4 w-4" />
          Pick Region from Screen
        </Button>
      ) : (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="relative max-h-screen max-w-screen">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="overflow-auto max-h-screen">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="cursor-crosshair max-w-full h-auto"
                />
              </div>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm text-muted-foreground">
                  Drag to select a region • ESC to cancel
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden video element for capturing */}
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
};
