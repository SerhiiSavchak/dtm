import { HomeView } from "@/components/home-view";
import { getInProgressContent } from "@/lib/sanity/get-in-progress";
import { getPortfolioProjects } from "@/lib/sanity/get-portfolio";

export default async function Home() {
  const [projects, inProgress] = await Promise.all([
    getPortfolioProjects(),
    getInProgressContent(),
  ]);
  return <HomeView projects={projects} inProgress={inProgress} />;
}
