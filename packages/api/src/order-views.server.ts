/** Terminal order statuses excluded from the unopened-order badge count. */
export const TERMINAL_ORDER_STATUSES = ["cancelled", "delivered"] as const;

export function countUnopenedOrders(
  activeOrderIds: string[],
  viewedOrderIds: Iterable<string>,
): number {
  const viewed = new Set(viewedOrderIds);
  return activeOrderIds.filter((id) => !viewed.has(id)).length;
}
