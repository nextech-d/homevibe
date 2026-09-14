export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
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
  brand: string;
  description: string;
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
