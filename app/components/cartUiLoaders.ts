/**
 * The cart drawer and toast load on first use rather than with every page.
 * These are the imports next/dynamic uses; calling one early only starts the
 * download - the bundler keeps the promise, so the later render reuses it.
 */
export const loadCartDrawer = () => import("./CartDrawer");
export const loadCartToast = () => import("./CartToast");

export function preloadCartUi(): void {
  void loadCartDrawer();
  void loadCartToast();
}

/**
 * Marks a control that's about to need the cart UI - the header's cart button,
 * every Add to cart. Hovering, focusing or touching one starts the download,
 * so by the click it's usually there.
 */
export const CART_INTENT_ATTRIBUTE = "data-cart-intent";
