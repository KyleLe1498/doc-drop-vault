import React, { useState, useRef, useCallback } from "react";
import { Upload, X, File, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

type UploadedFile = { filename: string; size: number; url: string };
type FileWithProgress = File & { progress?: number; uploaded?: boolean; error?: string };

export default function FileUpload() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const isAllowed = (f: File) =>
    f.type === "application/pdf" ||
    f.type === "text/plain" ||
    f.name.toLowerCase().endsWith(".pdf") ||
    f.name.toLowerCase().endsWith(".txt");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(isAllowed);
    if (droppedFiles.length === 0) {
      toast({ title: "Invalid file type", description: "Please select .txt or .pdf files only.", variant: "destructive" });
      return;
    }
    setFiles(droppedFiles as FileWithProgress[]); setUploaded([]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []).filter(isAllowed);
    if (selectedFiles.length === 0) {
      toast({ title: "Invalid file type", description: "Please select .txt or .pdf files only.", variant: "destructive" });
      return;
    }
    setFiles(selectedFiles as FileWithProgress[]); setUploaded([]);
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({ title: "No files selected", description: "Please choose at least one file first.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append("files", f)); // MUST be "files"

      // Use Vite proxy (forwards to http://localhost:8080)
      const res = await fetch("/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed");

      setUploaded(data.files as UploadedFile[]);
      toast({ title: "Upload complete!", description: `Successfully uploaded ${data.files.length} file(s).` });
      setFiles(prev => prev.map(f => ({ ...f, uploaded: true, progress: 100 })));
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      ? <File className="h-8 w-8 text-red-400" />
      : <FileText className="h-8 w-8 text-blue-400" />;

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-primary bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">File Upload Portal</h1>
          <p className="mt-4 text-lg text-muted-foreground">Upload your .txt and .pdf files with ease</p>
        </div>

        <div
          className={`relative mb-8 rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
            isDragActive ? "border-upload-active bg-gradient-accent shadow-glow" : "border-upload-border bg-upload-zone hover:border-upload-border hover:bg-upload-hover"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <input ref={fileInputRef} type="file" accept=".txt,.pdf" multiple onChange={handleFileSelect} className="hidden" />
          <div className="text-center">
            <div className={`mx-auto mb-4 rounded-full p-6 transition-colors ${isDragActive ? "bg-primary/20" : "bg-secondary"}`}>
              <Upload className={`mx-auto h-12 w-12 transition-colors ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">{isDragActive ? "Drop your files here" : "Upload your files"}</h3>
            <p className="mb-6 text-muted-foreground">
              Drag & drop files or{" "}
              <button onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline">browse</button>
            </p>
            <div className="text-sm text-muted-foreground">Supports: PDF, TXT • Max size: 10MB per file</div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Selected Files ({files.length})</h3>
            <div className="grid gap-4">
              {files.map((file, index) => (
                <div key={index} className="flex items-center rounded-lg bg-card p-4 shadow-card transition-all hover:shadow-lg">
                  <div className="mr-3">{file.uploaded ? <CheckCircle2 className="h-8 w-8 text-success" /> : getFileIcon(file)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    {isUploading && <Progress value={file.progress || 0} className="mt-2" />}
                  </div>
                  {!isUploading && !file.uploaded && (
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Button onClick={handleUpload} disabled={isUploading} className="bg-gradient-primary px-8 py-3 text-lg font-semibold shadow-glow hover:shadow-xl disabled:opacity-50">
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </div>
        )}

        {uploaded.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Uploaded Files ({uploaded.length})</h3>
            <div className="grid gap-4">
              {uploaded.map((file, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-card p-4 shadow-card">
                  <div className="flex items-center">
                    <CheckCircle2 className="mr-3 h-6 w-6 text-success" />
                    <div>
                      <p className="font-medium text-card-foreground">{file.filename}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    {/* use relative URL returned by server; proxy serves it */}
                    <a href={file.url} target="_blank" rel="noopener noreferrer">Open File</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
