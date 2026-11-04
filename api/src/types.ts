import type { OrderItemOption } from "../../shared/order-options.js";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
  /**
   * Coming in from a cart, each choice also carries its typeId and valueId -
   * only the valueIds are read, and checked against the product. Going out
   * (an order, an email, the admin), the type and value names stored on the
   * order item.
   */
  options?: OrderItemOption[];
};

export type Appliance = {
  id: number;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  status: string;
  image: string;
  images: string[];
  imageSet: {
    thumbnail: string;
    card: string;
    detail: string;
    gallery: string[];
  };
  specs: string;
  /** Null when the product has no brand. */
  brand: string | null;
  description: string;
  body?: string | null;
  faqs?: { question: string; answer: string }[];
  highlights: string[];
  isFeatured?: boolean;
};

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
