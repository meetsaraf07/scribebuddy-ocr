import { Card } from '@/components/ui/card';
import { CheckCircle2, FileText, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OCRResultsProps {
  text: string;
  confidence?: number;
  boxes?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    word: string;
    conf?: number;
  }>;
  imageUrl?: string;
  showOverlay: boolean;
}

export const OCRResults = ({ text, confidence, boxes, imageUrl, showOverlay }: OCRResultsProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle2 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">OCR Complete</h3>
      </div>
      
      {confidence !== undefined && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Average Confidence</p>
              <p className="text-2xl font-bold text-primary">
                {(confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {showOverlay && boxes && imageUrl && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detected Text Regions
          </h4>
          <div className="relative inline-block max-w-full">
            <img 
              src={imageUrl} 
              alt="OCR with overlay" 
              className="max-w-full h-auto rounded-lg"
            />
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'multiply' }}
            >
              {boxes.map((box, idx) => (
                <rect
                  key={idx}
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeOpacity="0.8"
                />
              ))}
            </svg>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Detected Words ({boxes.length})</p>
            <div className="flex flex-wrap gap-2">
              {boxes.slice(0, 20).map((box, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {box.word}
                  {box.conf !== undefined && (
                    <span className="ml-1 text-muted-foreground">
                      {(box.conf * 100).toFixed(0)}%
                    </span>
                  )}
                </Badge>
              ))}
              {boxes.length > 20 && (
                <Badge variant="secondary" className="text-xs">
                  +{boxes.length - 20} more
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}
      
      <Card className="p-6">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Extracted Text
        </h4>
        <div className="rounded-lg bg-muted p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
          {text || '(No text detected)'}
        </div>
      </Card>
    </div>
  );
};
