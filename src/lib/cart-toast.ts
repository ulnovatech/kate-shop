import { appToast } from "@/lib/app-toast";
import { triggerHaptic } from "@/lib/haptics";

export function showAddedToCartToast(productName: string, onViewCart: () => void): void {
  triggerHaptic("light");
  appToast.success(`Added ${productName} to cart`, {
    action: {
      label: "View cart",
      onClick: onViewCart,
    },
  });
}
