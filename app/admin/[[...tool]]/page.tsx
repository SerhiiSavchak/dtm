import type { Metadata, Viewport } from "next";
import {
  metadata as studioMetadata,
  viewport as studioViewport,
} from "next-sanity/studio";
import { StudioApp } from "./studio-app";
import { sanityProjectId } from "@/sanity/env";

export const dynamic = "force-static";

export const metadata: Metadata = {
  ...studioMetadata,
  title: "DTM — Адмінка",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  ...studioViewport,
};

export default function AdminPage() {
  if (!sanityProjectId) {
    return (
      <main
        style={{
          maxWidth: 40 * 16,
          margin: "4rem auto",
          padding: "0 1.5rem",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.5,
        }}
      >
        <h1>Адмінка ще не підключена</h1>
        <p>
          Створіть проєкт Sanity і додайте{" "}
          <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> та{" "}
          <code>NEXT_PUBLIC_SANITY_DATASET</code> у <code>.env.local</code>.
        </p>
      </main>
    );
  }

  return <StudioApp />;
}
