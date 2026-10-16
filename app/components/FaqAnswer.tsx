import Link from "next/link";
import { parseFaqAnswer } from "../lib/faq-links";
import { textLink } from "./homeSurfaces";

/**
 * An answer's text, with its [text](url) links as links where allowed. Shared
 * by the homepage and product FAQs, so an answer reads the same on both.
 */
export default function FaqAnswer({ answer }: { answer: string }) {
  const parts = parseFaqAnswer(answer);
  // No links: the answer as one string, exactly as it rendered before.
  if (parts.length === 1 && !parts[0].href) return <>{parts[0].text}</>;
  return (
    <>
      {parts.map((part, i) => {
        if (!part.href) return part.text;
        const className = `${textLink} underline`;
        return part.href.startsWith("/") ? (
          <Link key={i} href={part.href} className={className}>
            {part.text}
          </Link>
        ) : (
          <a key={i} href={part.href} className={className}>
            {part.text}
          </a>
        );
      })}
    </>
  );
}
