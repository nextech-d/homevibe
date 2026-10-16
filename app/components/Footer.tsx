import Image from "next/image";
import Link from "next/link";
import { categoryHref } from "../data/categories";
import { getAllCategories } from "../lib/categories.server";
import { getSiteSettingsData } from "../lib/storefront.server";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { Mail, Phone } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import { focusRing } from "./homeSurfaces";
import {
  MpesaLogo,
  VisaLogo,
  MastercardLogo,
  PayPalLogo,
  CashLogo,
} from "./PaymentLogos";

const PAYMENT_METHODS = [
  { label: "M-Pesa", Logo: MpesaLogo },
  { label: "Visa", Logo: VisaLogo },
  { label: "Mastercard", Logo: MastercardLogo },
  { label: "PayPal", Logo: PayPalLogo },
  { label: "Cash", Logo: CashLogo },
] as const;

/** Footer links: 44px tall on touch screens, tighter from lg where a pointer is the norm. */
const linkClass = `inline-flex min-h-11 min-w-11 items-center text-sm text-neutral-700 transition-colors hover:text-neutral-950 lg:min-h-8 ${focusRing}`;

const headingClass = "text-sm font-semibold text-neutral-950";

/** Calm, matching pills: the brand colours they replaced shouted over the page. */
const socialClass = `inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DCE0E7] bg-white px-4 text-sm font-medium text-neutral-800 transition-colors hover:border-[#a85414] hover:text-neutral-950 ${focusRing}`;

export default async function Footer() {
  const [categories, site] = await Promise.all([getAllCategories(), getSiteSettingsData()]);

  return (
    <footer className="mt-auto border-t border-[#DCE0E7] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Shop and Support sit side by side even on a phone: their 44px links
            stacked in one column made the footer longer than the screen twice over. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label={`${site.name} home`}
              className={`inline-flex min-h-11 items-center gap-2.5 rounded-lg ${focusRing}`}
            >
              <Image
                src="/logo.png"
                alt=""
                width={250}
                height={250}
                className="h-10 w-10 shrink-0 rounded-lg"
              />
              <span className="text-lg font-black tracking-tight text-neutral-950">
                {site.name}
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {site.tagline}. Based in {site.city}, delivering across {site.region}.
            </p>
            <div className="mt-2 flex flex-col">
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className={`${linkClass} gap-2`}>
                <Phone aria-hidden="true" className="h-4 w-4 text-[#a85414]" /> {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className={`${linkClass} gap-2`}>
                <Mail aria-hidden="true" className="h-4 w-4 text-[#a85414]" /> {site.email}
              </a>
            </div>
          </div>

          <div>
            <h3 className={headingClass}>Shop</h3>
            <ul className="mt-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={categoryHref(cat.slug)} className={linkClass}>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={headingClass}>Support</h3>
            <ul className="mt-2">
              <li><Link href="/#faq" className={linkClass}>FAQ</Link></li>
              <li><Link href="/blog" className={linkClass}>Blog</Link></li>
              <li><Link href="/articles" className={linkClass}>Buying guides</Link></li>
              <li><Link href="/cart" className={linkClass}>Your cart</Link></li>
              <li><Link href="/checkout" className={linkClass}>Checkout</Link></li>
              <li><Link href="/track-order" className={linkClass}>Track order</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h3 className={headingClass}>Get in touch</h3>
            <p className="mt-3 text-sm text-neutral-700">Questions about an order?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={buildWhatsAppUrl("Hi, I'd like to speak with HomeVibe.", site.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className={socialClass}
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                WhatsApp us
              </a>
              <a
                href={site.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className={socialClass}
              >
                Facebook
              </a>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className={socialClass}
              >
                Instagram
              </a>
              <a
                href={site.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className={socialClass}
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#DCE0E7] pt-6 sm:flex-row">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} {site.name}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map(({ label, Logo }) => (
              <span
                key={label}
                aria-label={label}
                title={label}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#DCE0E7] bg-white px-4 py-2"
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
