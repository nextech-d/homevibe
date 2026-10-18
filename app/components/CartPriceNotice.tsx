import { PRICE_CHANGE_NOTICE } from "../hooks/useCartPriceCheck";

/** The cart's price-change notice. Amber on amber, 6.4:1, like the Low stock badge. */
export default function CartPriceNotice({ className = "" }: { className?: string }) {
  return (
    <p role="status" className={`rounded-xl border border-[#F5D9B0] bg-[#FFF4E5] px-4 py-3 text-sm font-medium text-[#8A4B00] ${className}`}>
      {PRICE_CHANGE_NOTICE}
    </p>
  );
}
