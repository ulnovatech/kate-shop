import {
  defaultTemplate,
  renderNotificationTemplate,
  type NotificationEvent,
  type TemplateVars,
} from "@/lib/notifications";

/** Sample data for admin template preview (TM / messages tab). */
export const SAMPLE_TEMPLATE_VARS: TemplateVars = {
  customer_name: "Jane Nakato",
  order_reference: "KS-2406-001",
  grand_total: "UGX 185,000",
  payment_amount: "UGX 185,000",
  delivery_area: "Ntinda",
  phone: "+256 700 000 000",
};

export function previewNotificationTemplate(
  event: NotificationEvent,
  template: string | undefined | null,
): string {
  const source = template?.trim() || defaultTemplate(event);
  return renderNotificationTemplate(source, SAMPLE_TEMPLATE_VARS);
}
