import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, Loader2, RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type FrameShape = "square" | "wide";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Object URL or same-origin/CORS-enabled URL of the image being edited. */
  src: string | null;
  /** Original file name, used to keep a sensible name on the saved file. */
  fileName?: string;
  /** Frame the merchant crops into. */
  shape?: FrameShape;
  /** Longest edge of the exported image. */
  maxDimension?: number;
  /** Keep transparency (PNG output) instead of flattening to JPEG. */
  preserveAlpha?: boolean;
  title?: string;
  onSave: (file: File) => void | Promise<void>;
  /** Opens the file picker again without leaving the dialog. */
  onReplace?: () => void;
  onRemove?: () => void;
  saving?: boolean;
}

const ASPECT: Record<FrameShape, number> = { square: 1, wide: 16 / 9 };
const PREVIEW_WIDTH = 480;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const nameWithExtension = (name: string | undefined, extension: string) => {
  const base = (name ?? "image").replace(/\.[a-z0-9]{1,5}$/i, "") || "image";
  return `${base}.${extension}`;
};

/**
 * Lightweight crop / zoom / rotate editor.
 *
 * Everything happens on a canvas in the browser: the merchant drags to
 * reposition, zooms with the slider or wheel, rotates in quarter turns plus a
 * fine adjustment, and the exported file is downscaled to a sensible size so
 * storefronts stay fast.
 */
const ImageEditorDialog = ({
  open,
  onOpenChange,
  src,
  fileName,
  shape = "square",
  maxDimension = 1280,
  preserveAlpha = false,
  title = "Adjust your image",
  onSave,
  onReplace,
  onRemove,
  saving = false,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [quarterTurns, setQuarterTurns] = useState(0);
  const [fineAngle, setFineAngle] = useState(0);

  const frameWidth = PREVIEW_WIDTH;
  const frameHeight = Math.round(PREVIEW_WIDTH / ASPECT[shape]);

  /** Smallest scale that still covers the frame at the current rotation. */
  const coverScale = useCallback(
    (image: HTMLImageElement, turns: number) => {
      const swapped = turns % 2 !== 0;
      const w = swapped ? image.naturalHeight : image.naturalWidth;
      const h = swapped ? image.naturalWidth : image.naturalHeight;
      return Math.max(frameWidth / w, frameHeight / h);
    },
    [frameWidth, frameHeight],
  );

  const reset = useCallback(() => {
    const image = imageRef.current;
    if (!image) return;
    const fit = coverScale(image, 0);
    setBaseScale(fit);
    setScale(fit);
    setOffset({ x: 0, y: 0 });
    setQuarterTurns(0);
    setFineAngle(0);
  }, [coverScale]);

  // Load the source image whenever the dialog opens with a new file.
  useEffect(() => {
    if (!open || !src) return;
    setReady(false);
    setFailed(false);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      const fit = coverScale(image, 0);
      setBaseScale(fit);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
      setQuarterTurns(0);
      setFineAngle(0);
      setReady(true);
    };
    image.onerror = () => setFailed(true);
    image.src = src;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [open, src, coverScale]);

  /** Draws the source into a context of the given size using the same transform. */
  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const image = imageRef.current;
      if (!image) return;
      const ratio = width / frameWidth;
      ctx.clearRect(0, 0, width, height);
      if (!preserveAlpha) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.save();
      ctx.translate(width / 2 + offset.x * ratio, height / 2 + offset.y * ratio);
      ctx.rotate(((quarterTurns * 90 + fineAngle) * Math.PI) / 180);
      const drawScale = scale * ratio;
      ctx.drawImage(
        image,
        (-image.naturalWidth * drawScale) / 2,
        (-image.naturalHeight * drawScale) / 2,
        image.naturalWidth * drawScale,
        image.naturalHeight * drawScale,
      );
      ctx.restore();
    },
    [frameWidth, offset, quarterTurns, fineAngle, scale, preserveAlpha],
  );

  // Live preview.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = frameWidth * dpr;
    canvas.height = frameHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    paint(ctx, canvas.width, canvas.height);
  }, [paint, ready, frameWidth, frameHeight]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pinchRef.current.has(event.pointerId)) return;
    const previous = pinchRef.current.get(event.pointerId)!;

    if (pinchRef.current.size >= 2) {
      // Compute the previous span using the moved pointer's old position and the
      // other pointer's current position, BEFORE we overwrite it in the map.
      const points = [...pinchRef.current.values()];
      const other = points.find((p) => p !== previous)!;
      const previousDistance = Math.hypot(previous.x - other.x, previous.y - other.y);

      const current = { x: event.clientX, y: event.clientY };
      pinchRef.current.set(event.pointerId, current);

      const distance = Math.hypot(current.x - other.x, current.y - other.y);
      if (previousDistance > 0) {
        setScale((s) => clamp((s * distance) / previousDistance, baseScale * MIN_SCALE, baseScale * MAX_SCALE));
      }
      return;
    }

    // Single-pointer drag.
    pinchRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!dragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = frameWidth / rect.width;
    setOffset((o) => ({
      x: o.x + (event.clientX - dragRef.current!.x) * ratio,
      y: o.y + (event.clientY - dragRef.current!.y) * ratio,
    }));
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const endPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pinchRef.current.delete(event.pointerId);
    if (pinchRef.current.size === 0) dragRef.current = null;
  };

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.94 : 1.06;
    setScale((s) => clamp(s * factor, baseScale * MIN_SCALE, baseScale * MAX_SCALE));
  };

  const rotate = (direction: 1 | -1) => {
    const image = imageRef.current;
    if (!image) return;
    const next = (((quarterTurns + direction) % 4) + 4) % 4;
    setQuarterTurns(next);
    const fit = coverScale(image, next);
    setBaseScale(fit);
    setScale((s) => Math.max(s, fit));
  };

  const save = async () => {
    const image = imageRef.current;
    if (!image) return;
    const outWidth = Math.min(maxDimension, Math.round(frameWidth * 3));
    const outHeight = Math.round(outWidth / ASPECT[shape]);
    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    paint(ctx, outWidth, outHeight);

    const type = preserveAlpha ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, preserveAlpha ? undefined : 0.9),
    );
    if (!blob) return;
    const file = new File([blob], nameWithExtension(fileName, preserveAlpha ? "png" : "jpg"), { type });
    await onSave(file);
  };

  const zoomPercent = baseScale > 0 ? Math.round((scale / baseScale) * 100) : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>
            Drag to reposition, zoom to crop and rotate if it's the wrong way round.
          </DialogDescription>
        </DialogHeader>

        {failed ? (
          <p className="text-sm text-muted-foreground">
            We couldn't open that image for editing. You can still upload it as it is, or choose another one.
          </p>
        ) : (
          <div className="space-y-4">
            <div
              className="relative mx-auto w-full overflow-hidden rounded-2xl border border-border bg-secondary"
              style={{ aspectRatio: `${ASPECT[shape]}` }}
            >
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="animate-spin" size={18} />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
                style={{ display: ready ? "block" : "none" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
                onWheel={onWheel}
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/10" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Crop size={12} /> Zoom
                </span>
                <span>{zoomPercent}%</span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <Slider
                  value={[scale]}
                  min={baseScale * MIN_SCALE}
                  max={baseScale * MAX_SCALE}
                  step={baseScale / 100}
                  onValueChange={([v]) => setScale(v)}
                  aria-label="Zoom"
                />
                <ZoomIn size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Straighten</span>
                <span>{fineAngle}°</span>
              </div>
              <Slider
                value={[fineAngle]}
                min={-45}
                max={45}
                step={1}
                onValueChange={([v]) => setFineAngle(v)}
                aria-label="Straighten"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => rotate(-1)}>
                <RotateCcw size={14} /> Rotate left
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => rotate(1)}>
                <RotateCw size={14} /> Rotate right
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={reset}>
                <Undo2 size={14} /> Reset
              </Button>
              {onReplace && (
                <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={onReplace}>
                  Replace image
                </Button>
              )}
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="rounded-full" disabled={!ready || saving} onClick={save}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditorDialog;
