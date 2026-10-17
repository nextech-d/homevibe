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
 *
 * Providers are described by role, not named (hosting, database, email,
 * analytics, backups); Meta and WhatsApp are named because a visitor needs
 * the name to opt out or to know where a chat goes.
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

// The body type of a guide or blog post (renderMarkdown's classes); section
// headings are set in capitals by CSS, so a screen reader reads words, not letters.
const h2 = "mt-10 text-base font-semibold uppercase tracking-wide text-neutral-950";
const h3 = "mt-6 text-base font-semibold text-neutral-950";
const p = "my-4 text-base leading-relaxed text-neutral-700";
const ul = "my-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-neutral-700 marker:text-[#a85414]";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`section-${n}`}>
      <h2 id={`section-${n}`} className={h2}>
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

/** A bullet: a bold label, then one plain sentence. */
function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li>
      <strong className="font-semibold text-neutral-950">{label}:</strong> {children}
    </li>
  );
}

const emailLink = (
  <a href={`mailto:${BUSINESS.email}`} className={textLink}>
    {BUSINESS.email}
  </a>
);

const phoneLink = (
  <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className={textLink}>
    {BUSINESS.phone}
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
              At {BUSINESS.name} (homevibe.co.ke), we respect your privacy and are committed to
              protecting the personal data you share with us. This policy explains what we collect,
              how we use it and how we protect it, in line with Kenya&apos;s Data Protection Act,
              2019.
            </p>
          </header>

          <Section n={1} title="Information we collect">
            <ul className={ul}>
              <Item label="Order details">
                your name, email address, phone number, delivery address and town, and the
                products, quantities and total of your order, linked to your account if you&apos;re
                signed in.
              </Item>
              <Item label="Account details">
                if you create an account, your name, email address, phone number and a password,
                which we store only in scrambled (hashed) form so we can&apos;t read it.
              </Item>
              <Item label="Saved addresses">
                if you save delivery addresses, each one&apos;s label, address and town.
              </Item>
              <Item label="Order tracking">
                the order reference and phone number you enter, which we check against the order.
              </Item>
              <Item label="Technical data">
                your IP address, which we use to limit repeated attempts at signing in, registering
                and tracking orders, and which our hosting provider also records in its request
                logs.
              </Item>
              <Item label="Payment">
                we take M-Pesa, bank transfer and cash on delivery within Nairobi, all arranged
                after you order, and our website never asks for or stores card details.
              </Item>
            </ul>
          </Section>

          <Section n={2} title="How we use your information">
            <ul className={ul}>
              <Item label="Orders">to process and deliver your order.</Item>
              <Item label="Contacting you">
                to reach you about your order by phone, WhatsApp or email.
              </Item>
              <Item label="Service and warranty">
                for installation, service and warranty work on what you bought from us.
              </Item>
              <Item label="Preventing fraud and abuse">
                such as repeated sign-in attempts or the same order being placed twice.
              </Item>
              <Item label="Our ads">
                to measure and improve our Facebook and Instagram ads, through the Meta Pixel
                described in section 4.
              </Item>
            </ul>
          </Section>

          <Section n={3} title="Who we share it with">
            <p className={p}>
              We do not sell your personal data. We share it only with the services that run this
              website and our orders, and only what each one needs:
            </p>
            <ul className={ul}>
              <Item label="Hosting and database">
                our website hosting and database providers, which store the site and your order
                details.
              </Item>
              <Item label="Email">
                an email service that sends your order confirmations and updates to you, and tells
                us when you order.
              </Item>
              <Item label="Analytics">a website analytics service that counts page visits.</Item>
              <Item label="Backups">a service that stores encrypted backups of our database.</Item>
              <Item label="Meta (Facebook)">through the Meta Pixel described in section 4.</Item>
              <Item label="WhatsApp">
                if you choose to message us or order there, our WhatsApp buttons open a chat with
                a message about the product filled in, and nothing is sent until you send it.
              </Item>
              <Item label="Delivery partners">
                when we use one, the name, phone number and address they need to deliver your order.
              </Item>
            </ul>
            <p className={p}>
              Some of these providers store data on servers outside Kenya; our database, for
              example, is hosted in the United States.
            </p>
          </Section>

          <Section n={4} title="Cookies, analytics and the Meta Pixel">
            <ul className={ul}>
              <Item label="Sign-in cookie">
                only if you sign in, it keeps you signed in for up to 30 days and is removed when
                you sign out.
              </Item>
              <Item label="Your cart">
                kept in your browser&apos;s storage, with the products and quantities in it and
                nothing else.
              </Item>
              <Item label="Checkout key">
                kept in your browser for the visit, so an order isn&apos;t placed twice if you
                press the button again.
              </Item>
              <Item label="Analytics">a website analytics service counts the pages visited.</Item>
              <Item label="The Meta Pixel">
                a script from Meta that records which pages you visit and actions like viewing a
                product, adding to cart, starting checkout and placing an order, with the products,
                prices and order value. Depending on Meta&apos;s settings, it may also collect
                contact details you type into forms, such as your email or phone number, in hashed
                form. Meta&apos;s script sets its own cookie and receives your IP address and
                browser details, and Meta uses this under its own privacy policy.
              </Item>
            </ul>
            <h3 className={h3}>Opting out</h3>
            <ul className={ul}>
              <Item label="In your browser">
                block or clear third-party cookies in its settings, or use a browser or extension
                that blocks trackers.
              </Item>
              <Item label="On Facebook or Instagram">
                go to Accounts Centre, then Ad preferences, and turn off ads based on activity from
                Meta&apos;s partners.
              </Item>
            </ul>
          </Section>

          <Section n={5} title="How long we keep your data">
            <ul className={ul}>
              <Item label="Orders and accounts">
                until you ask us to delete them, so we can provide service and warranty on what you
                bought, though we may need to keep order records our accounts require.
              </Item>
              <Item label="Saved addresses">
                until you delete them in your account, or ask us to.
              </Item>
              <Item label="Sign-in">up to 30 days, or until you sign out.</Item>
              <Item label="IP addresses">
                those used to limit repeated attempts are kept for about a day.
              </Item>
              <Item label="Database backups">90 days.</Item>
              <Item label="Your cart">
                in your browser until you empty it or clear your browser&apos;s data.
              </Item>
            </ul>
          </Section>

          <Section n={6} title="Data security">
            <ul className={ul}>
              <Item label="HTTPS">
                the website is served over HTTPS, so data between your browser and us is encrypted.
              </Item>
              <Item label="Passwords">stored hashed, never as you typed them.</Item>
              <Item label="Sign-in cookie">it can&apos;t be read by scripts on the page.</Item>
              <Item label="Backups">database backups are encrypted before they&apos;re stored.</Item>
              <Item label="Staff access">
                our staff see orders only through a password-protected admin.
              </Item>
            </ul>
            <p className={p}>No website is completely secure, but these are the steps we take.</p>
          </Section>

          <Section n={7} title="Your rights (under Kenya's Data Protection Act)">
            <ul className={ul}>
              <Item label="Access">ask for a copy of the personal data we hold about you.</Item>
              <Item label="Correction">ask us to correct anything that&apos;s wrong.</Item>
              <Item label="Deletion">ask us to delete it.</Item>
              <Item label="Objection">ask us to stop using it for a purpose you object to.</Item>
            </ul>
            <p className={p}>
              Email {emailLink} with your request. We may ask you to confirm it&apos;s you, for
              example from the email or phone number on your order.
            </p>
          </Section>

          <Section n={8} title="Complaints (ODPC)">
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

          <Section n={9} title="Children's privacy">
            <p className={p}>
              Our site isn&apos;t directed at children under 18 and we don&apos;t knowingly collect
              their data.
            </p>
          </Section>

          <Section n={10} title="Changes to this policy">
            <p className={p}>
              When we change how we use personal data, we&apos;ll update this page and the
              &ldquo;Last updated&rdquo; date at the top.
            </p>
          </Section>

          <Section n={11} title="Contact us">
            <p className={p}>
              {BUSINESS.name} is responsible for your personal data under Kenya&apos;s Data
              Protection Act, 2019.
            </p>
            <ul className={ul}>
              <Item label="Address">
                {BUSINESS.name}, {BUSINESS.address}.
              </Item>
              <Item label="Email">{emailLink}</Item>
              <Item label="Phone">{phoneLink} (also on WhatsApp)</Item>
            </ul>
          </Section>
        </article>
      </div>
    </div>
  );
}
