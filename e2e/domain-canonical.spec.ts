import { expect, test } from "@playwright/test";

const WWW = "https://www.dtm.lviv.ua";
const APEX = "https://dtm.lviv.ua";

function isProductionHost(baseURL: string | undefined) {
  return Boolean(
    baseURL && /https:\/\/(www\.)?dtm\.lviv\.ua/i.test(baseURL)
  );
}

test.describe("production domain / SEO", () => {
  test.beforeEach(({}, testInfo) => {
    const base = testInfo.project.use.baseURL;
    test.skip(
      !isProductionHost(base),
      "Domain/SEO live checks run only against dtm.lviv.ua"
    );
  });

  test("www homepage canonical and OG use www host", async ({ request }) => {
    const response = await request.get(`${WWW}/`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="${WWW}"`);
    expect(html).toContain(`property="og:url" content="${WWW}"`);
    expect(html).toMatch(/name="robots" content="index, follow"/);
    expect(html).not.toContain("dtm-chi.vercel.app");
    expect(html).not.toContain("localhost");
  });

  test("sitemap and robots use www host", async ({ request }) => {
    const robots = await request.get(`${WWW}/robots.txt`);
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).toContain(`Sitemap: ${WWW}/sitemap.xml`);
    expect(robotsText).toMatch(/Disallow:\s*\/admin/i);
    expect(robotsText).not.toContain("dtm-chi.vercel.app");

    const sitemap = await request.get(`${WWW}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain(`<loc>${WWW}</loc>`);
    expect(xml).not.toContain("dtm-chi.vercel.app");
  });

  test("apex permanently redirects to www", async ({ request }) => {
    const response = await request.get(`${APEX}/`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(`${WWW}/`);
  });

  test("apex admin redirects to www admin", async ({ request }) => {
    const response = await request.get(`${APEX}/admin`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(`${WWW}/admin`);
  });

  test("www admin is noindex and GET revalidate is 405", async ({ request }) => {
    const admin = await request.get(`${WWW}/admin`);
    expect(admin.status()).toBe(200);
    const html = await admin.text();
    expect(html).toMatch(/name="robots" content="noindex, nofollow"/);
    expect(html).not.toContain("dtm-chi.vercel.app");

    const revalidate = await request.get(`${WWW}/api/revalidate`);
    expect(revalidate.status()).toBe(405);
  });
});
