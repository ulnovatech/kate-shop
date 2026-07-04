# Notifications — Phase 1 & Phase 2

## Phase 1 (Chunk 15 — implemented)

Manual customer notifications via WhatsApp. No automated API sends in V1.

### Flow

1. **Event fires** → row inserted into `notification_outbox` with `status = pending`
2. **Staff** opens `/admin/notifications` → **Send WhatsApp** (pre-filled `wa.me` link to customer phone)
3. Staff taps **Mark sent** after the message is delivered

### Events

| Event               | Trigger                                            |
| ------------------- | -------------------------------------------------- |
| `order_placed`      | Guest checkout completes (`placeOrder`)            |
| `payment_confirmed` | Payment recorded and order `payment_status = paid` |
| `order_shipped`     | Admin sets order status to `shipped`               |

### Templates

Edit in **Admin → Settings → Notification templates**.

Placeholders: `{{customer_name}}`, `{{order_reference}}`, `{{grand_total}}`, `{{payment_amount}}`, `{{delivery_area}}`, `{{phone}}`

### Database

```bash
npm run db:chunk15
```

Table: `notification_outbox` — see `supabase/migrations/20260611120000_chunk15_notifications.sql`

---

## Phase 2 (future — no schema change required)

The outbox table is designed for automated delivery:

| Column          | Phase 2 use                            |
| --------------- | -------------------------------------- |
| `channel`       | `whatsapp` / `email`                   |
| `status`        | Worker marks `sent` or `failed`        |
| `metadata`      | Provider message IDs, webhook payloads |
| `error_message` | API failure details                    |

### Recommended architecture

```
notification_outbox (pending)
        ↓
  Edge Function / cron worker
        ↓
  MTN MoMo SMS API / WhatsApp Business API / Resend (email)
        ↓
  status = sent | failed
```

### Provider options (Uganda)

- **WhatsApp Business API** (Meta Cloud API) — template messages, delivery receipts
- **Africa's Talking** — SMS + optional WhatsApp
- **Email** — Resend / SendGrid using `recipient_email` and `subject` columns (add subject in Phase 2 worker)

### Webhook extension

Optional `provider_callback_reference` pattern (same as `payments` table) can be stored in `metadata` when providers return external IDs.

No migration needed for Phase 2 if workers read/write existing outbox columns.
