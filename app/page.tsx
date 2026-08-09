import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Intro } from "@/components/intro";
import { Projects } from "@/components/projects";
import { Services } from "@/components/services";
import { EstimateCta } from "@/components/estimate-cta";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
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
