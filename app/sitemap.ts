import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const SITE_URL = siteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
