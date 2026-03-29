import { X } from "@phosphor-icons/react";

interface EventImageUploadProps {
  currentImage?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function EventImageUpload({ currentImage, onSelect, onClose }: EventImageUploadProps) {
  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-0 top-1/2 z-[71] mx-auto w-full max-w-md -translate-y-1/2 rounded-xl border border-stroke bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Event Thumbnail</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input
            type="url"
            placeholder="Paste image URL…"
            className="block w-full rounded-lg border border-stroke bg-secondary px-3 py-2 text-sm focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) onSelect(val);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">Press Enter to confirm</p>
        </div>
      </div>
    </>
  );
}
