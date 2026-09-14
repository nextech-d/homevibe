import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import CartToast from "./components/CartToast";
import SiteJsonLd from "./components/SiteJsonLd";
import FaqJsonLd from "./components/FaqJsonLd";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { BrandsProvider } from "./context/BrandsContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { StorefrontProvider } from "./context/StorefrontContext";
import { buildRootMetadataFromContext } from "./lib/seo";

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

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadataFromContext();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-black">
        <SiteJsonLd />
        <FaqJsonLd />
        <CartProvider>
          <ProductsProvider>
            <CategoriesProvider>
              <BrandsProvider>
              <StorefrontProvider>
                <Header />
                <CartDrawer />
                <CartToast />
                <main className="flex-grow">{children}</main>
                <Footer />
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
