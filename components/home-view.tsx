"use client";

import { useCallback, useState } from "react";
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
import { useLocale } from "@/lib/i18n/locale-context";

export function HomeView() {
  const [boot, setBoot] = useState(false);
  const { isSwitching } = useLocale();

  const onLoaderDone = useCallback(() => setBoot(true), []);

  return (
    <>
      <PageLoader onDone={onLoaderDone} />
      <DocumentMeta />
      <SiteHeader boot={boot} />
      <div className={`locale-fade ${isSwitching ? "is-switching" : ""}`}>
        <main>
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
