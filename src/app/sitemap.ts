import type { MetadataRoute } from "next";
import { TAROT_DECK } from "@/lib/tarot/cards";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/tarot"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/tarot/cards"), changeFrequency: "monthly", priority: 0.8 },
    ...TAROT_DECK.map((card) => ({
      url: absoluteUrl(`/tarot/cards/${card.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
