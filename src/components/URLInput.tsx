import { useState } from 'react';
import { Link, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface URLInputProps {
  onURLSubmit: (url: string) => void;
}

export const URLInput = ({ onURLSubmit }: URLInputProps) => {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handlePreview = () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      new URL(url);
      setPreview(url);
      toast.success('Preview loaded');
    } catch {
      toast.error('Invalid URL format');
    }
  };

  const handleSubmit = () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      new URL(url);
      onURLSubmit(url);
    } catch {
      toast.error('Invalid URL format');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePreview();
            }}
            className="pl-10"
          />
        </div>
        
        <Button onClick={handlePreview} variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
      
      {preview && (
        <div className="rounded-lg overflow-hidden border border-border shadow-soft">
          <img 
            src={preview} 
            alt="URL Preview" 
            className="w-full h-auto max-h-96 object-contain bg-muted"
            onError={() => {
              toast.error('Failed to load image from URL');
              setPreview(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
