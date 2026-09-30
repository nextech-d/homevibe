"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { useSiteSettings } from "../context/StorefrontContext";
import {
  EMPTY_GOOGLE_REVIEWS,
  fetchGoogleReviewsClient,
  type GoogleReview,
  type GoogleReviewsData,
} from "../lib/google-reviews";

function Stars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 text-neutral-200"
          }`}
        />
      ))}
    </span>
  );
}

/** Google's Places policy requires the author's avatar, name and profile link. */
function ReviewAvatar({ review }: { review: GoogleReview }) {
  if (review.authorPhotoUrl) {
    return (
      <Image
        src={review.authorPhotoUrl}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-600">
      {review.author.charAt(0).toUpperCase()}
    </span>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-[color:var(--surface)] p-5">
      <div className="flex items-center gap-3">
        <ReviewAvatar review={review} />
        <div className="min-w-0">
          {review.authorUrl ? (
            <a
              href={review.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-semibold text-black hover:underline"
            >
              {review.author}
            </a>
          ) : (
            <span className="block truncate text-sm font-semibold text-black">
              {review.author}
            </span>
          )}
          {review.relativeTime && (
            <span className="text-[10px] text-black/50">{review.relativeTime}</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Stars rating={review.rating} className="h-3.5 w-3.5" />
        <span className="sr-only">{review.rating} out of 5 stars</span>
      </div>

      {review.text && (
        <blockquote className="mt-3 line-clamp-6 text-xs leading-relaxed text-black/80">
          {review.text}
        </blockquote>
      )}

      {review.googleMapsUri && (
        <figcaption className="mt-auto pt-4">
          <a
            href={review.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold text-black/50 hover:text-black"
          >
            Read on Google
          </a>
        </figcaption>
      )}
    </figure>
  );
}

function WriteReviewButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-neutral-800"
    >
      <Star className="h-3.5 w-3.5" />
      Rate us on Google
    </a>
  );
}

export default function GoogleReviews() {
  const [data, setData] = useState<GoogleReviewsData>(EMPTY_GOOGLE_REVIEWS);
  const site = useSiteSettings();

  useEffect(() => {
    fetchGoogleReviewsClient().then(setData);
  }, []);

  // No place ID configured — render nothing rather than an empty shell.
  if (!data.configured) return null;

  const { rating, userRatingCount, reviews, googleMapsUri, writeReviewUrl } = data;

  // No reviews on the profile yet. A section headed "what our customers say"
  // with nothing under it reads as broken, so invite the first review instead.
  if (reviews.length === 0) {
    if (!writeReviewUrl) return null;
    return (
      <section
        id="google-reviews"
        className="mt-24 rounded-2xl border border-neutral-200/80 bg-[color:var(--surface)] px-6 py-10 text-center"
      >
        <Stars rating={0} className="mx-auto h-5 w-5" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-black">
          Be the first to review {site.name}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
          Bought from us? A quick word on Google helps other shoppers in {site.city} find
          us — and takes less than a minute.
        </p>
        <div className="mt-6 flex justify-center">
          <WriteReviewButton href={writeReviewUrl} />
        </div>
      </section>
    );
  }

  return (
    <section id="google-reviews" className="mt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black">What our customers say</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/60">
            {rating !== null ? (
              <>
                <Stars rating={rating} />
                <span className="font-bold tabular-nums text-black">{rating.toFixed(1)}</span>
                {userRatingCount !== null && (
                  <span className="tabular-nums">
                    ({userRatingCount} {userRatingCount === 1 ? "review" : "reviews"})
                  </span>
                )}
                <span className="text-black/40">on Google</span>
              </>
            ) : (
              <span>Verified reviews from our Google Business Profile.</span>
            )}
          </div>
        </div>

        {writeReviewUrl && <WriteReviewButton href={writeReviewUrl} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Required attribution for Places API data. */}
      {data.live && (
        <p className="mt-4 text-[10px] text-black/40">
          Reviews powered by Google
          {googleMapsUri && (
            <>
              {" · "}
              <a
                href={googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:text-black"
              >
                See all reviews on Google Maps
              </a>
            </>
          )}
        </p>
      )}
    </section>
  );
}
