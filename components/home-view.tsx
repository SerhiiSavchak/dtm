"use client";

import { useSyncExternalStore } from "react";
import { DocumentMeta } from "./document-meta";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import { Intro } from "./intro";
import { Projects } from "./projects";
import { Services } from "./services";
import { Process } from "./sections/process";
import { InProgress } from "./sections/in-progress";
import { EstimateCta } from "./estimate-cta";
import { Faq } from "./sections/faq";
import { SiteFooter } from "./site-footer";
import { PageLoader } from "./page-loader";
import { ScrollProgress } from "./fx/scroll-progress";
import { SubtleGrain } from "./fx/subtle-grain";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getLoaderPhase,
  getServerLoaderPhase,
  subscribeLoader,
} from "@/lib/boot-session";

export function HomeView() {
  const phase = useSyncExternalStore(
    subscribeLoader,
    getLoaderPhase,
    getServerLoaderPhase
  );
  const boot = phase === "out" || phase === "gone";
  const { isSwitching } = useLocale();

  return (
    <>
      <PageLoader />
      <SubtleGrain />
      <ScrollProgress />
      <DocumentMeta />
      <SiteHeader boot={boot} />
      <div className={`locale-fade min-w-0 ${isSwitching ? "is-switching" : ""}`}>
        <main className="min-w-0">
          <Hero boot={boot} />
          <Intro />
          <Projects />
          <Services />
          <Process />
          <InProgress />
          <EstimateCta />
          <Faq />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
