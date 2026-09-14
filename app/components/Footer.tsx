import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { categoryHref } from "../data/categories";
import { getAllCategories } from "../lib/categories.server";
import { getSiteSettingsData } from "../lib/storefront.server";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { Mail, Phone } from "lucide-react";
import {
  MpesaLogo,
  VisaLogo,
  MastercardLogo,
  PayPalLogo,
  CashLogo,
} from "./PaymentLogos";

const PAYMENT_METHODS = [
  { label: "M-Pesa", Logo: MpesaLogo, className: "bg-white hover:bg-neutral-50" },
  { label: "Visa", Logo: VisaLogo, className: "bg-white hover:bg-neutral-50" },
  { label: "Mastercard", Logo: MastercardLogo, className: "bg-white hover:bg-neutral-50" },
  { label: "PayPal", Logo: PayPalLogo, className: "bg-white hover:bg-neutral-50" },
  { label: "Cash", Logo: CashLogo, className: "bg-white hover:bg-neutral-50" },
] as const;

export default async function Footer() {
  noStore();
  const [categories, site] = await Promise.all([getAllCategories(), getSiteSettingsData()]);

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              aria-label={`${site.name} home`}
              className="inline-flex items-center gap-2.5"
            >
              <Image
                src="/logo.png"
                alt=""
                width={250}
                height={250}
                className="h-10 w-auto shrink-0"
              />
              <span className="text-lg font-black uppercase tracking-tighter text-black">
                {site.name}
              </span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-black/70">
              {site.tagline}. Serving {site.city} and {site.region}.
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-black/70 hover:text-black">
                <Phone className="h-3.5 w-3.5" /> {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-black/70 hover:text-black">
                <Mail className="h-3.5 w-3.5" /> {site.email}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/50">Shop</h3>
            <ul className="mt-3 space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={categoryHref(cat.slug)} className="text-xs font-semibold text-black hover:text-black/70">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/50">Support</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/#faq" className="text-xs font-semibold text-black hover:text-black/70">FAQ</Link></li>
              <li><Link href="/cart" className="text-xs font-semibold text-black hover:text-black/70">Your Cart</Link></li>
              <li><Link href="/checkout" className="text-xs font-semibold text-black hover:text-black/70">Checkout</Link></li>
              <li><Link href="/track-order" className="text-xs font-semibold text-black hover:text-black/70">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/50">Get in Touch</h3>
            <p className="mt-3 text-xs text-black/70">
              Questions about an order or showroom visit?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={buildWhatsAppUrl("Hi, I'd like to speak with HomeVibe.", site.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-emerald-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700"
              >
                WhatsApp Us
              </a>
              <a
                href={site.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-blue-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-blue-700"
              >
                Facebook
              </a>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:opacity-90"
              >
                Instagram
              </a>
              <a
                href={site.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-neutral-900 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-black"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row">
          <p className="text-[10px] font-semibold text-black/50">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map(({ label, Logo, className }) => (
              <span
                key={label}
                aria-label={label}
                title={label}
                className={`inline-flex h-9 items-center justify-center rounded-full border border-neutral-200 px-4 py-2 transition ${className}`}
              >
                <Logo className="h-4 w-auto" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
