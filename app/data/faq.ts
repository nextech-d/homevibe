import { SITE } from "../config/site";

export const FAQ_LIST = [
  {
    q: "Do you offer installation services?",
    a: `Yes. We deliver and install across ${SITE.region}. Our team sets everything up and walks you through how it works — no extra charge on most orders in Nairobi.`,
  },
  {
    q: "What is your warranty policy?",
    a: "Every product carries a 12-month warranty on parts and labour, serviced by our own technicians. Some manufacturers add longer cover on specific components - the product page says so where that applies.",
  },
  {
    q: "Do you ship internationally?",
    a: `We deliver throughout ${SITE.region}. For other destinations, email ${SITE.email} and we'll quote you directly.`,
  },
  {
    q: "Are the appliances smart home compatible?",
    a: "Many models connect to Wi-Fi and work with Alexa, Google Assistant, or Apple HomeKit. Check the product page for details on each item.",
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
    q: "Can I view products in person?",
    a: `Visit our ${SITE.city} showroom to see items on display. Walk in during business hours or book a visit if you'd like someone to meet you.`,
  },
  {
    q: "How do I schedule maintenance?",
    a: `Call ${SITE.phone} or WhatsApp us. We're available for warranty repairs and routine service bookings.`,
  },
] as const;
