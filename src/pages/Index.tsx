// src/pages/Index.tsx
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { Sparkles, RefreshCw, Upload, Link, Monitor } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { URLInput } from "@/components/URLInput";
import { ScreenPicker } from "@/components/ScreenPicker";
import { OCRResults } from "@/components/OCRResults";

import { runOCRFile, runOCRUrl, type OcrResp } from "@/lib/api";

const Index = () => {
  // inputs/state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "screen">("upload");

  // settings
  // NOTE: use OCR.space language codes (eng, spa, fra, deu, zho, jpn)
  const [language, setLanguage] = useState<string>("eng");
  const [showOverlay, setShowOverlay] = useState<boolean>(true);

  // OCR mutation using centralized api.ts helpers
  const ocrMutation = useMutation<OcrResp, Error, { file?: File; url?: string }>({
    mutationFn: async ({ file, url }) => {
      if (file) return runOCRFile(file, language, showOverlay);
      if (url) return runOCRUrl(url, language, showOverlay);
      throw new Error("No file or URL provided");
    },
    onSuccess: () => toast.success("OCR processing completed!"),
    onError: (err) => toast.error(err.message || "OCR request failed"),
  });

  // handlers
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setImageUrl(url); // so OCRResults can preview even for uploads
    setActiveTab("upload");
  };

  const handleURLSubmit = (url: string) => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    setImageUrl(url);
    setActiveTab("url");
  };

  // ScreenPicker provides a Blob of the cropped region
  const handleScreenCapture = (blob: Blob) => {
    const file = new File([blob], "screen-capture.png", { type: "image/png" });
    handleFileSelected(file);
    setActiveTab("upload");
    toast.success("Screen region captured!");
  };

  const handleRunOCR = () => {
    if (activeTab === "upload" && selectedFile) {
      ocrMutation.mutate({ file: selectedFile });
    } else if ((activeTab === "url" || activeTab === "screen") && imageUrl) {
      ocrMutation.mutate({ url: imageUrl });
    } else {
      toast.error("Please provide an image first");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setImageUrl(null);
    ocrMutation.reset();
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunOCR();
      } else if (e.key === "Escape") {
        handleReset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, imageUrl, activeTab, language, showOverlay]);

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-primary p-2.5">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Handwriting OCR
              </h1>
              <p className="text-sm text-muted-foreground">
                Advanced handwriting recognition powered by AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Card className="p-6 shadow-medium">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <Link className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="screen" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    Screen
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="upload" className="mt-0">
                    <UploadZone
                      onImageSelected={handleFileSelected}
                      preview={preview}
                      onClearPreview={handleReset}
                    />
                  </TabsContent>

                  <TabsContent value="url" className="mt-0">
                    {/* Ensure your URLInput calls onURLSubmit(url: string) */}
                    <URLInput onURLSubmit={handleURLSubmit} />
                  </TabsContent>

                  <TabsContent value="screen" className="mt-0">
                    {/* Ensure your ScreenPicker calls onImageCaptured(blob: Blob) */}
                    <ScreenPicker onImageCaptured={handleScreenCapture} />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>

            {/* Results */}
            {ocrMutation.data && (
              <OCRResults
                text={ocrMutation.data.text}
                confidence={ocrMutation.data.avg_conf}
                boxes={ocrMutation.data.boxes}
                imageUrl={imageUrl || undefined}
                showOverlay={showOverlay}
              />
            )}
          </div>

          {/* Right column - controls */}
          <div className="space-y-4">
            <Card className="p-6 space-y-6 shadow-medium sticky top-24">
              <div>
                <h3 className="text-sm font-medium mb-3">Settings</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* OCR.space codes */}
                        <SelectItem value="eng">English</SelectItem>
                        <SelectItem value="spa">Spanish</SelectItem>
                        <SelectItem value="fra">French</SelectItem>
                        <SelectItem value="deu">German</SelectItem>
                        <SelectItem value="zho">Chinese</SelectItem>
                        <SelectItem value="jpn">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="overlay" className="cursor-pointer">
                      Show overlay boxes
                    </Label>
                    <Switch
                      id="overlay"
                      checked={showOverlay}
                      onCheckedChange={setShowOverlay}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  onClick={handleRunOCR}
                  disabled={(!selectedFile && !imageUrl) || ocrMutation.isPending}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-strong"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {ocrMutation.isPending ? "Processing..." : "Run OCR"}
                </Button>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                  disabled={ocrMutation.isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>

                <div className="text-xs text-muted-foreground pt-2 space-y-1">
                  <p>⌨️ Ctrl+Enter to run OCR</p>
                  <p>⌨️ Esc to reset</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
