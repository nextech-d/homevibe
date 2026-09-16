import "server-only";

import { Resend } from "resend";
import { SITE } from "../config/site";
import { absoluteUrl } from "./seo";

type StatusEmailDetails = {
  trackingId: string;
  status: string;
  customerName: string;
  customerEmail: string;
};

function emailShell(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#171717;max-width:560px;margin:0 auto;padding:24px;">
  <p style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#737373;margin:0 0 8px;">
    ${SITE.name}
  </p>
  <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
  <p style="font-size:12px;color:#737373;margin:0;">
    Questions? Reply to this email or WhatsApp ${SITE.phone}.
  </p>
</body>
</html>`;
}

function buildStatusUpdateHtml(order: StatusEmailDetails): string {
  const trackUrl = absoluteUrl(`/track-order?id=${encodeURIComponent(order.trackingId)}`);

  return emailShell(
    `Order update: ${order.trackingId}`,
    `
    <p style="margin:0 0 12px;font-size:14px;">
      Hi ${order.customerName}, your order status is now:
    </p>
    <p style="font-size:18px;font-weight:700;color:#059669;margin:0 0 16px;">${order.status}</p>
    <p style="margin:0 0 12px;font-size:14px;color:#525252;">
      Track anytime with reference <strong style="font-family:monospace;">${order.trackingId}</strong>.
    </p>
    <p style="margin:20px 0 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
        View order status
      </a>
    </p>`
  );
}

export async function sendOrderStatusEmail(order: StatusEmailDetails): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "HomeVibe <onboarding@resend.dev>";

  await Promise.allSettled([
    resend.emails.send({
      from,
      to: order.customerEmail,
      subject: `Order ${order.trackingId} — ${order.status}`,
      html: buildStatusUpdateHtml(order),
    }),
  ]);
}
