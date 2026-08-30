import { createClient, type SanityClient } from "next-sanity";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/sanity/env";

const isDev = process.env.NODE_ENV !== "production";

let client: SanityClient | null | undefined;

/**
 * Published-only client. Dataset/project come from env — never hardcoded.
 * Dev uses the API (not CDN) so a Studio publish is visible after refresh.
 */
export function getSanityClient(): SanityClient | null {
  if (client !== undefined) return client;
  if (!sanityProjectId) {
    client = null;
    return client;
  }

  client = createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    useCdn: !isDev,
    perspective: "published",
  });
  return client;
}

export function sanityFetchOptions(): {
  cache?: RequestCache;
  next?: { revalidate: number };
} {
  if (isDev) return { cache: "no-store" };
  return { next: { revalidate: 60 } };
}
