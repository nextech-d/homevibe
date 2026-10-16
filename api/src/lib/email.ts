import { Resend } from "resend";
import { SITE, absoluteUrl } from "./site.js";
import type { OrderPayload } from "./orders.js";

type OrderEmailDetails = {
  trackingId: string;
  total: number;
  customer: Pick<OrderPayload, "name" | "email" | "phone" | "address" | "city">;
  items: OrderPayload["items"];
};

type StatusEmailDetails = {
  trackingId: string;
  status: string;
  customerName: string;
  customerEmail: string;
};

/**
 * Escapes a value for HTML text or a quoted attribute. Every value that
 * reaches these emails from outside the code goes through it - customer
 * name, phone, product names, references, statuses - because a customer
 * name like <a href=...> would otherwise arrive in someone's inbox as a
 * real link, sent from HomeVibe's own address.
 */
function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatKes(amount: number): string {
  return new Intl.NumberFormat(SITE.currency.locale, {
    style: "currency",
    currency: SITE.currency.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

function emailShell(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#171717;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;">${escapeHtml(title)}</h1>
  ${body}
</body>
</html>`;
}

function buildItemsHtml(items: OrderPayload["items"]): string {
  return items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} × ${escapeHtml(item.qty)} — ${escapeHtml(formatKes(item.price * item.qty))}</li>`
    )
    .join("");
}

export function buildCustomerConfirmationHtml(order: OrderEmailDetails): string {
  const trackUrl = absoluteUrl(`/track-order?id=${encodeURIComponent(order.trackingId)}`);
  return emailShell(
    `Thanks for your order, ${order.customer.name}!`,
    `<p>Reference: <strong>${escapeHtml(order.trackingId)}</strong></p>
     <ul>${buildItemsHtml(order.items)}</ul>
     <p><strong>Total: ${escapeHtml(formatKes(order.total))}</strong></p>
     <p><a href="${escapeHtml(trackUrl)}">Track your order</a></p>`
  );
}

export function buildOrderHtml(order: OrderEmailDetails): string {
  return emailShell(
    `New order ${order.trackingId}`,
    `<p>${escapeHtml(order.customer.name)} — ${escapeHtml(order.customer.phone)}</p>
     <ul>${buildItemsHtml(order.items)}</ul>
     <p><strong>Total: ${escapeHtml(formatKes(order.total))}</strong></p>`
  );
}

export function buildStatusUpdateHtml(order: StatusEmailDetails): string {
  const trackUrl = absoluteUrl(`/track-order?id=${encodeURIComponent(order.trackingId)}`);
  return emailShell(
    `Order update: ${order.trackingId}`,
    `<p>Hi ${escapeHtml(order.customerName)}, status: <strong>${escapeHtml(order.status)}</strong></p>
     <p><a href="${escapeHtml(trackUrl)}">View order</a></p>`
  );
}

type OutgoingEmail = { role: string; to: string; subject: string; html: string };

/**
 * Sends through Resend and logs every outcome that isn't a delivery. Resend
 * reports a refused send - an unverified sender domain, a bad key - in its
 * return value rather than by throwing, so without this check a failure
 * vanished: no email, no error, nobody told. Never throws; an order must not
 * fail because its email did. Logs the recipient's role, not their address.
 */
async function sendAll(context: string, emails: OutgoingEmail[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`RESEND_API_KEY is not set, so no email was sent for ${context}.`);
    return;
  }

  const resend = new Resend(apiKey);
  // onboarding@resend.dev only delivers to the Resend account's own address;
  // customers get nothing until EMAIL_FROM is on a domain verified in Resend.
  const from = process.env.EMAIL_FROM?.trim() || "HomeVibe <onboarding@resend.dev>";

  const results = await Promise.allSettled(
    emails.map(({ to, subject, html }) => resend.emails.send({ from, to, subject, html }))
  );
  results.forEach((result, i) => {
    const { role } = emails[i];
    if (result.status === "rejected") {
      console.error(`Email to ${role} for ${context} failed:`, result.reason);
    } else if (result.value.error) {
      console.error(`Resend refused the email to ${role} for ${context}:`, result.value.error);
    }
  });
}

export async function sendOrderEmails(order: OrderEmailDetails): Promise<void> {
  const emails: OutgoingEmail[] = [
    {
      role: "the shop",
      to: SITE.email,
      subject: `New order ${order.trackingId}`,
      html: buildOrderHtml(order),
    },
  ];
  if (order.customer.email.trim()) {
    emails.push({
      role: "the customer",
      to: order.customer.email.trim(),
      subject: `Your HomeVibe order ${order.trackingId}`,
      html: buildCustomerConfirmationHtml(order),
    });
  }
  await sendAll(`order ${order.trackingId}`, emails);
}

export async function sendOrderStatusEmail(order: StatusEmailDetails): Promise<void> {
  if (!order.customerEmail.trim()) return;
  await sendAll(`order ${order.trackingId} status update`, [
    {
      role: "the customer",
      to: order.customerEmail.trim(),
      subject: `Order ${order.trackingId} — ${order.status}`,
      html: buildStatusUpdateHtml(order),
    },
  ]);
}
