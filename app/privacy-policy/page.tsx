import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import { pageHeading, raisedSurface, textLink } from "../components/homeSurfaces";
import { buildPageMetadata } from "../lib/seo";

/**
 * The privacy policy. Every statement here is what the code does - checked
 * against it on 2026-10-17 - so when the data the site collects or the
 * services it uses change, this page has to change with them, along with
 * LAST_UPDATED.
 */

const LAST_UPDATED = "17 October 2026";
const LAST_UPDATED_ISO = "2026-10-17";

/** The business details as the owner gave them for this page. */
const BUSINESS = {
  name: "HomeVibe",
  address: "Taveta Road, Nairobi, Kenya",
  email: "homevibekenya@gmail.com",
  phone: "+254 182 230 250",
} as const;

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "What personal data HomeVibe collects when you shop with us, why, who we share it with, how long we keep it, and your rights under Kenya's Data Protection Act, 2019.",
  path: "/privacy-policy",
});

// The same type scale as a guide or blog post body (renderMarkdown's classes).
const h2 = "mt-10 text-xl font-semibold tracking-tight text-neutral-950";
const h3 = "mt-6 text-base font-semibold text-neutral-950";
const p = "my-4 text-base leading-relaxed text-neutral-700";
const ul = "my-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-neutral-700 marker:text-[#a85414]";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className={h2}>{title}</h2>
      {children}
    </section>
  );
}

const emailLink = (
  <a href={`mailto:${BUSINESS.email}`} className={textLink}>
    {BUSINESS.email}
  </a>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumbs
          className="mb-6"
          items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
        />
        <article className={`${raisedSurface} px-5 py-8 sm:px-10 sm:py-12`}>
          <header className="mb-8 border-b border-[#DCE0E7] pb-8">
            <h1 className={pageHeading}>Privacy Policy</h1>
            <p className="mt-4 text-sm text-neutral-600">
              Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
            </p>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">
              This page explains what personal data we collect when you use this website or order
              from us, what we do with it, and the choices you have.
            </p>
          </header>

          <Section title="Who we are">
            <p className={p}>
              {BUSINESS.name} sells home appliances and gym equipment in Kenya. We decide how the
              personal data described here is used, so we are responsible for it under Kenya&apos;s
              Data Protection Act, 2019.
            </p>
            <ul className={ul}>
              <li>Address: {BUSINESS.address}</li>
              <li>Email: {emailLink}</li>
              <li>
                Phone:{" "}
                <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className={textLink}>
                  {BUSINESS.phone}
                </a>
              </li>
            </ul>
          </Section>

          <Section title="What we collect">
            <h3 className={h3}>When you place an order</h3>
            <p className={p}>
              Your name, email address, phone number, delivery address and town, and the products,
              quantities and total of your order. If you&apos;re signed in, the order is linked to
              your account.
            </p>

            <h3 className={h3}>If you create an account</h3>
            <p className={p}>
              Your name, email address, phone number and a password. We store the password only in
              scrambled (hashed) form, so we can&apos;t read it. If you save delivery addresses, we
              keep each one&apos;s label, address and town.
            </p>

            <h3 className={h3}>When you track an order</h3>
            <p className={p}>
              The order reference and phone number you enter, which we check against the order.
            </p>

            <h3 className={h3}>Technical data</h3>
            <p className={p}>
              Your IP address, which we use to limit repeated attempts at signing in, registering
              and tracking orders. Our hosting provider also records it in its request logs.
            </p>

            <h3 className={h3}>Payment</h3>
            <p className={p}>
              We take payment by M-Pesa, bank transfer, or cash on delivery within Nairobi, arranged
              with you after you order. This website doesn&apos;t ask for or store card details, and
              nothing is charged on it.
            </p>
          </Section>

          <Section title="Why we use it">
            <ul className={ul}>
              <li>To process and deliver your order.</li>
              <li>To contact you about your order by phone, WhatsApp or email.</li>
              <li>For installation, service and warranty work on what you bought from us.</li>
              <li>
                To prevent fraud and abuse, such as repeated sign-in attempts or the same order being
                placed twice.
              </li>
              <li>
                To measure and improve our Facebook and Instagram ads, through the Meta Pixel
                described below.
              </li>
            </ul>
          </Section>

          <Section title="Who we share it with">
            <p className={p}>
              Only the services that run this website and our orders, and only what each one needs:
            </p>
            <ul className={ul}>
              <li>Vercel, which hosts the website, and provides our page-view statistics.</li>
              <li>Neon, which hosts our database.</li>
              <li>
                Resend, which sends order emails: to us when you order, and to you with your
                confirmation and order updates.
              </li>
              <li>GitHub, which stores encrypted backups of our database.</li>
              <li>Meta (Facebook), through the Meta Pixel described below.</li>
              <li>
                WhatsApp, if you choose to message us there. Our WhatsApp buttons open a chat with a
                message about the product filled in; nothing is sent until you send it.
              </li>
              <li>
                Delivery partners, when we use one: the name, phone number and address they need to
                deliver your order.
              </li>
            </ul>
            <p className={p}>
              Our database is hosted in the United States, and these services may process data
              outside Kenya.
            </p>
          </Section>

          <Section title="Cookies, browser storage and the Meta Pixel">
            <ul className={ul}>
              <li>
                <strong className="font-semibold text-neutral-950">Sign-in cookie</strong>, only if
                you sign in. It keeps you signed in for up to 30 days and is removed when you sign
                out.
              </li>
              <li>
                <strong className="font-semibold text-neutral-950">Your cart</strong>, kept in your
                browser&apos;s storage: the products and quantities in it, nothing else.
              </li>
              <li>
                <strong className="font-semibold text-neutral-950">A checkout key</strong>, kept in
                your browser for the visit, so an order isn&apos;t placed twice if you press the
                button again.
              </li>
              <li>
                <strong className="font-semibold text-neutral-950">The Meta Pixel</strong>, a script
                from Meta. It records which pages you visit and actions like viewing a product,
                adding to cart, starting checkout and placing an order, with the products, prices
                and order value. Depending on Meta&apos;s settings, it may also collect contact
                details you type into forms, such as your email or phone number, in hashed form.
                Meta&apos;s script sets its own cookie and receives your IP address and browser
                details, and Meta uses this under its own privacy policy.
              </li>
            </ul>
            <h3 className={h3}>Opting out</h3>
            <ul className={ul}>
              <li>
                Block or clear third-party cookies in your browser&apos;s settings, or use a browser
                or extension that blocks trackers.
              </li>
              <li>
                In your Facebook or Instagram settings, go to Accounts Centre, then Ad preferences,
                and turn off ads based on activity from Meta&apos;s partners.
              </li>
            </ul>
          </Section>

          <Section title="How long we keep it">
            <ul className={ul}>
              <li>
                Orders and accounts: until you ask us to delete them, so we can provide service and
                warranty on what you bought. We may need to keep order records our accounts require.
              </li>
              <li>Saved addresses: until you delete them in your account, or ask us to.</li>
              <li>Sign-in: up to 30 days, or until you sign out.</li>
              <li>IP addresses used to limit repeated attempts: about a day.</li>
              <li>Database backups: 90 days.</li>
              <li>Your cart: in your browser until you empty it or clear your browser&apos;s data.</li>
            </ul>
          </Section>

          <Section title="Security">
            <ul className={ul}>
              <li>The website is served over HTTPS, so data between your browser and us is encrypted.</li>
              <li>Passwords are stored hashed, never as you typed them.</li>
              <li>The sign-in cookie can&apos;t be read by scripts on the page.</li>
              <li>Database backups are encrypted before they&apos;re stored.</li>
              <li>Our staff see orders only through a password-protected admin.</li>
            </ul>
            <p className={p}>No website is completely secure, but these are the steps we take.</p>
          </Section>

          <Section title="Your rights">
            <p className={p}>Under Kenya&apos;s Data Protection Act, 2019, you can ask us to:</p>
            <ul className={ul}>
              <li>give you a copy of the personal data we hold about you;</li>
              <li>correct anything that&apos;s wrong;</li>
              <li>delete it;</li>
              <li>stop using it for a purpose you object to.</li>
            </ul>
            <p className={p}>
              Email {emailLink} with your request. We may ask you to confirm it&apos;s you, for
              example from the email or phone number on your order.
            </p>
          </Section>

          <Section title="Complaints">
            <p className={p}>
              If you&apos;re unhappy with how we&apos;ve handled your data, please tell us first at{" "}
              {emailLink}. You can also complain to the Office of the Data Protection Commissioner
              (ODPC) at{" "}
              <a href="https://www.odpc.go.ke" className={textLink} rel="noopener noreferrer">
                odpc.go.ke
              </a>
              .
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p className={p}>
              When we change how we use personal data, we&apos;ll update this page and the
              &ldquo;Last updated&rdquo; date at the top.
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}
