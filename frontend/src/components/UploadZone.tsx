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
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border px-8 py-16 text-center transition-all duration-300
        ${
          isDragging
            ? "border-accent/50 bg-accent-soft"
            : "border-dashed border-hairline bg-surface hover:border-accent-hairline hover:bg-accent-soft/40"
        }
        ${isAnalyzing ? "pointer-events-none border-solid" : ""}`}
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
          <Loader2 className="h-7 w-7 animate-spin text-accent" strokeWidth={1.5} />
          <div>
            <p className="font-serif text-lg text-ink">Reading your screenshot</p>
            <p className="mt-1 text-sm text-ink-faint">This usually takes a few seconds.</p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-full border border-hairline bg-paper p-3.5 transition-colors duration-300 group-hover:border-accent-hairline">
            <UploadCloud className="h-5 w-5 text-ink-soft transition-colors group-hover:text-accent" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[15px] font-medium text-ink">
              Drop a screenshot here, click to browse, or paste it
            </p>
            <p className="mt-1.5 text-sm text-ink-faint">
              Bills, error messages, legal docs, insurance letters, forms — anything confusing.
            </p>
          </div>
        </>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-brick">
          <ImageOff className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
