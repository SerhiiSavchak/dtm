import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Intro } from "@/components/intro";
import { Projects } from "@/components/projects";
import { Services } from "@/components/services";
import { EstimateCta } from "@/components/estimate-cta";
import { SiteFooter } from "@/components/site-footer";
import { DocumentMeta } from "@/components/document-meta";

export default function Home() {
  return (
    <>
      <DocumentMeta />
      <SiteHeader />
      <main>
        <Hero />
        <Intro />
        <Projects />
        <Services />
        <EstimateCta />
      </main>
      <SiteFooter />
    </>
  );
}
