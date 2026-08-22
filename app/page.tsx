import { HomeView } from "@/components/home-view";
import { getPortfolioProjects } from "@/lib/sanity/get-portfolio";

export default async function Home() {
  const projects = await getPortfolioProjects();
  return <HomeView projects={projects} />;
}
