import Image from "next/image";
import Link from "next/link";
import { categoryHref } from "../data/categories";
import { getAllCategories } from "../lib/categories.server";
import { getSiteSettingsData } from "../lib/storefront.server";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { Landmark, Mail, Phone } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./SocialIcons";
import { focusRing } from "./homeSurfaces";
import { CashLogo, MpesaLogo } from "./PaymentLogos";

/** The ways we take payment - and only those: no cards, no PayPal. */
const PAYMENT_SUMMARY = "Pay by M-Pesa, bank transfer, or cash on delivery within Nairobi.";

/** One size for every payment badge: three fit in a row on a 320px screen. */
const paymentBadge =
  "flex h-16 w-[5.25rem] items-center justify-center rounded-lg border border-[#DCE0E7] bg-white px-1.5 sm:w-28";

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
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:gap-x-10">
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
            <h3 className={headingClass}>Get in touch with us</h3>
            <p className="mt-3 text-sm text-neutral-700">Questions about an order?</p>
            {/* One per line, icon beside the name, all one width so the column
                reads as a list: a row of pills wrapped unevenly. */}
            <div className="mt-3 flex w-full max-w-52 flex-col gap-2">
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
                <FacebookIcon className="h-4 w-4 text-[#0866FF]" />
                Facebook
              </a>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className={socialClass}
              >
                <InstagramIcon className="h-4 w-4 text-[#E4405F]" />
                Instagram
              </a>
              <a
                href={site.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className={socialClass}
              >
                <TikTokIcon className="h-4 w-4 text-neutral-950" />
                TikTok
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#DCE0E7] pt-6 sm:flex-row">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} {site.name}
          </p>
          {/* Three badges of one size in one row down to 320px, each named in
              text. M-Pesa's wordmark is its name, so that one is spelled out
              for screen readers only. */}
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p id="payment-methods" className="text-center text-xs text-neutral-600 sm:text-right">
              {PAYMENT_SUMMARY}
            </p>
            <ul aria-labelledby="payment-methods" className="flex items-stretch gap-2">
              <li className={paymentBadge}>
                <MpesaLogo className="h-5 w-auto max-w-full" />
                <span className="sr-only">M-Pesa</span>
              </li>
              <li className={`${paymentBadge} flex-col gap-1 text-center`}>
                <Landmark aria-hidden="true" className="h-4 w-4 shrink-0 text-neutral-700" />
                <span className="text-[11px] font-medium leading-tight text-neutral-800">Bank transfer</span>
              </li>
              <li className={`${paymentBadge} flex-col gap-1 text-center`}>
                <CashLogo className="h-4 w-auto shrink-0" />
                <span className="text-[11px] font-medium leading-tight text-neutral-800">Cash on delivery</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
