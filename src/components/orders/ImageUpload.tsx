import { useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageEditorDialog from "@/components/orders/ImageEditorDialog";
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

/** Longest edge of the saved image, kept small so storefronts load fast. */
const MAX_DIMENSION: Record<MediaKind, number> = { logo: 512, hero: 1600, item: 1280 };

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
  const [editing, setEditing] = useState(false);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [editName, setEditName] = useState<string | undefined>();
  const [preserveAlpha, setPreserveAlpha] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const closeEditor = () => {
    setEditing(false);
    if (editSrc?.startsWith("blob:")) URL.revokeObjectURL(editSrc);
    setEditSrc(null);
  };

  const upload = async (file: File) => {
    if (!merchantId) return;
    setBusy(true);
    try {
      const { url } = await uploadMerchantImage(merchantId, kind, file);
      onChange(url);
      closeEditor();
      toast.success("Image saved");
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try a different image.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const pick = async (file?: File) => {
    if (!file) return;
    if (!merchantId) {
      toast.error("Finish creating your account first", {
        description: "We'll store your images against your business.",
      });
      return;
    }

    // SVGs can't be cropped meaningfully on a canvas — upload them as they are.
    if (file.type === "image/svg+xml") {
      toast.info("Vector logos are used exactly as supplied", {
        description: "Upload a PNG or JPG if you'd like to crop or rotate it.",
      });
      await upload(file);
      return;
    }

    if (editSrc?.startsWith("blob:")) URL.revokeObjectURL(editSrc);
    setEditSrc(URL.createObjectURL(file));
    setEditName(file.name);
    setPreserveAlpha(file.type === "image/png" || file.type === "image/webp");
    setEditing(true);
  };

  /** Re-open an already saved image for a further adjustment. */
  const editExisting = async () => {
    if (!value) return;
    setLoadingExisting(true);
    try {
      const response = await fetch(value);
      if (!response.ok) throw new Error("fetch failed");
      const blob = await response.blob();
      if (blob.type === "image/svg+xml") {
        toast.info("Vector logos can't be cropped", { description: "Upload a PNG or JPG to adjust it." });
        return;
      }
      if (editSrc?.startsWith("blob:")) URL.revokeObjectURL(editSrc);
      setEditSrc(URL.createObjectURL(blob));
      setEditName(label.toLowerCase().replace(/\s+/g, "-"));
      setPreserveAlpha(blob.type === "image/png" || blob.type === "image/webp");
      setEditing(true);
    } catch {
      toast.error("We couldn't open that image for editing", {
        description: "Upload it again to make changes.",
      });
    } finally {
      setLoadingExisting(false);
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
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={busy || loadingExisting}
              onClick={editExisting}
            >
              {loadingExisting ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
              Edit
            </Button>
          )}
          <Button
            type="button"
            variant={value ? "ghost" : "outline"}
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

      <ImageEditorDialog
        open={editing}
        onOpenChange={(next) => (next ? setEditing(true) : closeEditor())}
        src={editSrc}
        fileName={editName}
        shape={shape}
        maxDimension={MAX_DIMENSION[kind]}
        preserveAlpha={preserveAlpha}
        title={label}
        saving={busy}
        onSave={upload}
        onReplace={() => inputRef.current?.click()}
        onRemove={
          value
            ? () => {
                onChange(null);
                closeEditor();
              }
            : undefined
        }
      />
    </div>
  );
};

export default ImageUpload;
