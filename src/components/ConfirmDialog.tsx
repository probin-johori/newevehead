import { useEffect } from "react";
import { X } from "@phosphor-icons/react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onCancel} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-card border border-stroke p-5 shadow-[0_8px_40px_rgba(0,0,0,0.15)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-selected transition-colors">{cancelLabel}</button>
            <button
              onClick={onConfirm}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
