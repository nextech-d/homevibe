"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCart } from "../context/CartContext";
import { CART_INTENT_ATTRIBUTE, loadCartDrawer, loadCartToast, preloadCartUi } from "./cartUiLoaders";

// Client-only: neither renders anything until it's opened, so there's nothing
// to server-render, and both are fixed overlays, so arriving late shifts nothing.
const CartDrawer = dynamic(loadCartDrawer, { ssr: false });
const CartToast = dynamic(loadCartToast, { ssr: false });

/**
 * The drawer mounts the first time the cart opens and the toast the first
 * time something is added, then both stay mounted - they hide themselves
 * when closed. Their code is fetched on the first sign it's wanted: a hover,
 * focus or touch on any control marked with CART_INTENT_ATTRIBUTE.
 */
export default function LazyCartUI() {
  const { cartOpen, toast } = useCart();
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [toastMounted, setToastMounted] = useState(false);

  // Adjusting state while rendering, React's pattern for state derived from
  // a change: no extra effect pass before the drawer starts loading.
  if (cartOpen && !drawerMounted) setDrawerMounted(true);
  if (toast && !toastMounted) setToastMounted(true);

  useEffect(() => {
    const onIntent = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(`[${CART_INTENT_ATTRIBUTE}]`)) return;
      preloadCartUi();
      events.forEach((type) => document.removeEventListener(type, onIntent, true));
    };
    const events = ["pointerover", "focusin", "touchstart"] as const;
    events.forEach((type) => document.addEventListener(type, onIntent, { capture: true, passive: true }));
    return () => events.forEach((type) => document.removeEventListener(type, onIntent, true));
  }, []);

  return (
    <>
      {drawerMounted && <CartDrawer />}
      {toastMounted && <CartToast />}
    </>
  );
}
