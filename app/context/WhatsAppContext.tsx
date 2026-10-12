"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SITE } from "../config/site";

/**
 * The WhatsApp number the product links dial: the admin-set value the footer
 * uses, resolved once on the server by the root layout and handed down here,
 * so the footer, product buttons and card icons can never disagree. No client
 * fetch - the number is in the server-rendered HTML from the start.
 *
 * The default is the same config fallback the settings lookup itself uses,
 * and only matters for something rendered outside the root layout.
 */
const WhatsAppContext = createContext<string>(SITE.whatsapp);

export function WhatsAppProvider({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return <WhatsAppContext.Provider value={number}>{children}</WhatsAppContext.Provider>;
}

export function useWhatsAppNumber(): string {
  return useContext(WhatsAppContext);
}
