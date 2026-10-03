import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
config({ path: ".env.local" });

const PATTERNS: [string, RegExp][] = [
  ["delivery-cost", /(KSh|Ksh|KES)\s?\d{2,4}\s?[–-]\s?\d{2,4}|delivery (fee|charge|cost)|courier rate|free delivery/gi],
  ["warranty", /(3[\s-]*year|three[\s-]*year|compressor warranty|12[\s-]*month|twelve months)/gi],
  ["nairobi-framing", /\b(in|around|across|outside|within) Nairobi\b|Nairobi['’]s|much of Nairobi|Nairobi homes/gi],
];

function hits(text: string) {
  const out: string[] = [];
  for (const [name, re] of PATTERNS) {
    for (const m of text.match(re) ?? []) out.push(`${name}:"${m}"`);
  }
  return [...new Set(out)];
}

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    console.log("--- products (description / body / specs)");
    for (const p of await prisma.product.findMany({ select: { id: true, name: true, description: true, body: true, specs: true } })) {
      const h = hits([p.description, p.body ?? "", p.specs].join(" \n "));
      if (h.length) console.log(`  #${p.id} ${p.name.slice(0, 38).padEnd(38)} ${h.join(" ")}`);
    }
    console.log("--- product FAQs");
    for (const f of await prisma.productFaq.findMany()) {
      const h = hits(f.question + " " + f.answer);
      if (h.length) console.log(`  product ${f.productId}: "${f.question.slice(0, 44)}" ${h.join(" ")}`);
    }
    console.log("--- site FAQ");
    for (const f of await prisma.faqItem.findMany()) {
      const h = hits(f.question + " " + f.answer);
      if (h.length) console.log(`  #${f.id} "${f.question.slice(0, 40)}" ${h.join(" ")}`);
    }
    console.log("--- content posts / settings");
    for (const c of await prisma.contentPost.findMany()) {
      const h = hits(c.title + c.body);
      if (h.length) console.log(`  post ${c.slug}: ${h.join(" ")}`);
    }
    for (const s of await prisma.siteSetting.findMany()) {
      const h = hits(s.value);
      if (h.length) console.log(`  setting ${s.key}: ${h.join(" ")}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main();
