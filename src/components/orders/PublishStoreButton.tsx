import { useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { storePath, useSetStorefrontStatus, type SetupSnapshot } from "@/lib/orders/setup";
import { toast } from "sonner";

interface Props {
  snapshot: SetupSnapshot;
  catalogLabel?: string;
  size?: "sm" | "default";
  className?: string;
  onPublished?: () => void;
}

/**
 * The single publish/pause control. Whether it's on the dashboard or at the end
 * of the wizard, publishing means the same thing and explains itself first.
 */
const PublishStoreButton = ({ snapshot, catalogLabel = "items", size = "sm", className, onPublished }: Props) => {
  const setStatus = useSetStorefrontStatus();
  const [confirming, setConfirming] = useState(false);

  const outstanding = snapshot.tasks.filter((t) => t.required && t.id !== "publish" && !t.done);
  const blocked = !snapshot.canPublish || !snapshot.storefrontId;

  const apply = (status: "published" | "paused") => {
    if (!snapshot.storefrontId) return;
    setStatus.mutate(
      { id: snapshot.storefrontId, status },
      {
        onSuccess: () => {
          setConfirming(false);
          if (status === "published") {
            toast.success("Your store is live", {
              description: "We've emailed your store link — share it and start taking orders.",
            });
            onPublished?.();
          } else {
            toast.success("Store paused", {
              description: "Customers can't order right now. Resume any time — your link stays the same.",
            });
          }
        },
        onError: (error) =>
          toast.error("Couldn't update your store", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      },
    );
  };

  if (snapshot.isPublic) {
    return (
      <Button
        size={size}
        variant="secondary"
        className={`rounded-full ${className ?? ""}`}
        disabled={setStatus.isPending}
        onClick={() => apply("paused")}
      >
        {setStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
        Pause store
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        className={`rounded-full ${className ?? ""}`}
        disabled={blocked || setStatus.isPending}
        onClick={() => setConfirming(true)}
      >
        {setStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
        {snapshot.status === "paused" ? "Resume store" : "Publish store"}
      </Button>

      {blocked && outstanding.length > 0 && (
        <p className="w-full text-xs text-muted-foreground">
          Still to finish before publishing:{" "}
          {outstanding.map((t) => (t.id === "catalog" ? catalogLabel : t.label)).join(", ")}.
        </p>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish your store?</AlertDialogTitle>
            <AlertDialogDescription>
              Your store becomes publicly visible and starts taking orders at{" "}
              <span className="font-semibold text-foreground">
                loumilab.com{snapshot.slug ? storePath(snapshot.slug) : ""}
              </span>
              . You can pause it any time and your link never changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                apply("published");
              }}
            >
              {setStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Publish store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PublishStoreButton;
