import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadMerchantImage, type MediaKind } from "@/lib/orders/media";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  /** Required to upload — storage paths are scoped to the merchant. */
  merchantId?: string;
  kind: MediaKind;
  value?: string | null;
  onChange: (url: string | null) => void;
  label: string;
  hint?: string;
  /** Square preview for logos, wide preview for item images. */
  shape?: "square" | "wide";
  className?: string;
}

/** Shared image picker for store logos and catalog imagery. */
const ImageUpload = ({
  merchantId,
  kind,
  value,
  onChange,
  label,
  hint,
  shape = "square",
  className,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!merchantId) {
      toast.error("Finish creating your account first", {
        description: "We'll store your images against your business.",
      });
      return;
    }
    setBusy(true);
    try {
      const { url } = await uploadMerchantImage(merchantId, kind, file);
      onChange(url);
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try a different image.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary",
            shape === "square" ? "h-16 w-16" : "h-16 w-28",
          )}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <ImagePlus size={18} className="text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground"
              onClick={() => onChange(null)}
            >
              <X size={14} /> Remove
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
};

export default ImageUpload;
