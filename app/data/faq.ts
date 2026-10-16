import { SITE } from "../config/site";

export const FAQ_LIST = [
  {
    q: "Do you offer installation services?",
    a: `Yes, countrywide. We deliver, install and run it with you before we leave. Delivery is free anywhere in Nairobi; everywhere else we confirm the courier rate with you before dispatch.`,
  },
  {
    q: "What is your warranty policy?",
    a: "Every product carries a 12-month warranty on parts and labour, serviced by our own technicians. Some brands, like Hisense, add a longer manufacturer warranty with a warranty card in the box; the product page says so where that applies.",
  },
  {
    q: "What is the return policy?",
    a: "Unopened items can be returned within 5 days of delivery. Installed appliances may carry a restocking fee unless faulty — we'll inspect and arrange pickup.",
  },
  {
    q: "Do you offer financing?",
    a: "Not online yet. Message us on WhatsApp or call to talk through installment options for larger orders.",
  },
  {
    q: "How do I schedule maintenance?",
    a: `Call ${SITE.phone} or WhatsApp us. We're available for warranty repairs and routine service bookings.`,
  },
] as const;
