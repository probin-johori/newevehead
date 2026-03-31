import { useState, useRef } from "react";
import { X, MagnifyingGlass, Upload, Image as ImageIcon } from "@phosphor-icons/react";

interface EventImageUploadProps {
  currentImage?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
];

export function EventImageUpload({ currentImage, onSelect, onClose }: EventImageUploadProps) {
  const [tab, setTab] = useState<"upload" | "unsplash">("unsplash");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredImages = search.trim()
    ? SAMPLE_IMAGES.filter((_, i) => i < 8)
    : SAMPLE_IMAGES;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onSelect(url);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-card border border-stroke shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden"
          onKeyDown={e => e.key === "Escape" && onClose()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-stroke">
            <h3 className="text-base font-semibold">Event Thumbnail</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-stroke">
            {(["unsplash", "upload"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "unsplash" ? "Choose from Gallery" : "Upload from System"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === "unsplash" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-stroke bg-secondary px-3 py-2">
                  <MagnifyingGlass size={14} className="text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search images..." className="bg-transparent text-sm focus:outline-none flex-1" />
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                  {filteredImages.map((url, i) => (
                    <button key={i} onClick={() => onSelect(url)}
                      className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-accent transition-colors focus:outline-none focus:border-accent">
                      <img src={url} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "upload" && (
              <div className="space-y-4">
                {currentImage && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={currentImage} alt="Current" className="w-full h-32 object-cover" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white font-medium">Current image</span>
                  </div>
                )}
                <button onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stroke rounded-xl bg-secondary hover:bg-selected transition-colors cursor-pointer">
                  <Upload size={24} className="text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 10MB</p>
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={handleFileChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
