"use client";

import type { KeyboardEvent, ReactNode } from "react";

/**
 * The hero's category row. Server-rendered links inside; the only client work
 * is marking a tile pressed while Enter is held, since browsers give links no
 * :active state from the keyboard. Taps and clicks use plain :active.
 */
export default function HeroCategoryNav({ className, children }: { className?: string; children: ReactNode }) {
  const press = (e: KeyboardEvent<HTMLElement>, pressed: boolean) => {
    if (e.key !== "Enter") return;
    const link = (e.target as HTMLElement).closest("a");
    if (link) link.toggleAttribute("data-pressed", pressed);
  };

  return (
    <nav
      aria-label="Shop by category"
      className={className}
      onKeyDown={(e) => press(e, true)}
      onKeyUp={(e) => press(e, false)}
      onBlur={(e) => (e.target as HTMLElement).removeAttribute("data-pressed")}
    >
      {children}
    </nav>
  );
}
