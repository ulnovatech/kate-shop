import { Heart, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCustomerSession } from "@/lib/customer-session-context";
import { useWishlist } from "@/lib/wishlist";
import { toggleWishlistItem } from "@/lib/api/wishlist.functions";
import { humanizeError } from "@/lib/errors";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  productName?: string;
  className?: string;
};

export function WishlistButton({ productId, productName, className }: WishlistButtonProps) {
  const { session } = useCustomerSession();
  const has = useWishlist((s) => s.has(productId));
  const toggleLocal = useWishlist((s) => s.toggleLocal);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      toggleWishlistItem({
        data: { customerId: session!.customerId, productId },
      }),
    onMutate: () => toggleLocal(productId),
    onSuccess: (result) => {
      if (result.saved) {
        toast.success(productName ? `Saved ${productName}` : "Saved to wishlist");
      } else {
        toast.message("Removed from wishlist");
      }
      if (session?.customerId) {
        qc.invalidateQueries({ queryKey: ["wishlist", session.customerId] });
      }
    },
    onError: (e: unknown) => {
      toggleLocal(productId);
      toast.error(humanizeError(e, { fallback: "Could not update your wishlist." }));
    },
  });

  const saved = has;

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      disabled={mutation.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (session?.customerId) {
          mutation.mutate();
        } else {
          const wasSaved = has;
          toggleLocal(productId);
          toast.message(wasSaved ? "Removed from wishlist" : "Saved locally", {
            description: "Order once to sync across devices.",
          });
        }
      }}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border bg-background/90 backdrop-blur transition-colors hover:bg-secondary",
        saved && "border-gold text-gold",
        className,
      )}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
      )}
    </button>
  );
}
