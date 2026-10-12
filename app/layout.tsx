import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import CartToast from "./components/CartToast";
import SiteJsonLd from "./components/SiteJsonLd";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { BrandsProvider } from "./context/BrandsContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { StorefrontProvider } from "./context/StorefrontContext";
import { WhatsAppProvider } from "./context/WhatsAppContext";
import { buildRootMetadataFromContext } from "./lib/seo";
import { getCategoriesFromDb } from "./lib/categories.server";
import { getBrandsFromDb } from "./lib/brands.server";
import { getSiteSettingsData } from "./lib/storefront.server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

/**
 * The backstop for every page that renders statically: at most 60 seconds
 * before a page whose on-demand refresh was missed is regenerated. Admin saves
 * refresh everything at once through /api/revalidate; this is only for what
 * slips past that. Pages that read cookies or search params stay dynamic -
 * this does not make anything static.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadataFromContext();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-rendered so the nav ships its real categories and brands in the
  // initial HTML rather than the static lists the client fetch used to patch in.
  // The site settings are the footer's own (memoised, so one query between
  // them): product links dial the same WhatsApp number the footer does.
  const [navCategories, navBrands, siteSettings] = await Promise.all([
    getCategoriesFromDb(),
    getBrandsFromDb(),
    getSiteSettingsData(),
  ]);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-black">
        <SiteJsonLd />
        <CartProvider>
          <ProductsProvider>
            <CategoriesProvider initial={navCategories}>
              <BrandsProvider initial={navBrands}>
              <StorefrontProvider>
              <WhatsAppProvider number={siteSettings.whatsapp}>
                <Header />
                <CartDrawer />
                <CartToast />
                <main className="flex-grow">{children}</main>
                <Footer />
              </WhatsAppProvider>
              </StorefrontProvider>
              </BrandsProvider>
            </CategoriesProvider>
          </ProductsProvider>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
