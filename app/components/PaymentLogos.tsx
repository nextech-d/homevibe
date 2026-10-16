/**
 * The footer's payment marks, for the ways we actually take payment: M-Pesa,
 * bank transfer and cash on delivery within Nairobi. No cards, no PayPal - so
 * no badges for them. M-Pesa has no published glyph, so it's the wordmark set
 * in type; bank transfer uses lucide's Landmark in the footer itself.
 *
 * Decorative: the badge around each carries its name.
 */
type LogoProps = {
  className?: string;
};

export function MpesaLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 -1 54 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <text
        x="0"
        y="14"
        fill="#39B54A"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="13"
        fontWeight="900"
        letterSpacing="-0.5"
      >
        M-PESA
      </text>
    </svg>
  );
}

export function CashLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="1 5 22 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="#404040" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" stroke="#404040" strokeWidth="1.5" />
      <path d="M6 9.5h.01M18 14.5h.01" stroke="#404040" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
