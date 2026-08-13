import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2, ImageOff } from "lucide-react";

interface UploadZoneProps {
  onSelectImage: (imageBase64: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadZone({ onSelectImage, isAnalyzing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      setError(null);
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image (screenshot) file.");
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      onSelectImage(dataUrl, file.type);
    },
    [onSelectImage]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onPaste={(e) => {
        const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
        if (item) handleFile(item.getAsFile());
      }}
      onClick={() => !isAnalyzing && inputRef.current?.click()}
      className={`group relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer
        ${isDragging ? "border-violet-500 bg-violet-50" : "border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50/50"}
        ${isAnalyzing ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {isAnalyzing ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-lg font-medium text-slate-700">Reading your screenshot…</p>
          <p className="text-sm text-slate-500">Plainly is figuring out what this means.</p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-violet-100 p-4 transition-transform group-hover:scale-105">
            <UploadCloud className="h-8 w-8 text-violet-600" />
          </div>
          <p className="text-lg font-semibold text-slate-800">
            Drop a screenshot here, click to browse, or paste it (Ctrl+V)
          </p>
          <p className="text-sm text-slate-500">
            Bills, error messages, legal docs, insurance letters, forms — anything confusing.
          </p>
        </>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600">
          <ImageOff className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
