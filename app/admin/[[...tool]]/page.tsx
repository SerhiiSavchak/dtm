import type { Metadata, Viewport } from "next";
import {
  metadata as studioMetadata,
  viewport as studioViewport,
} from "next-sanity/studio";
import { StudioApp } from "./studio-app";
import { sanityProjectId } from "@/sanity/env";

const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
] as const;

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
          Для embedded Sanity Studio потрібні публічні змінні середовища (без
          секретів):
        </p>
        <ul>
          {REQUIRED_PUBLIC_ENV.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p>
          Локально — у <code>.env.local</code>. На Vercel — у Project → Settings
          → Environment Variables для <strong>Production</strong> (і Preview, якщо
          потрібно), потім <strong>Redeploy</strong>.{" "}
          <code>NEXT_PUBLIC_*</code> підставляються під час білду.
        </p>
      </main>
    );
  }

  return <StudioApp />;
}
