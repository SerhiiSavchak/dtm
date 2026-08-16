export type UtmFields = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

function clip(value: string | null, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export function utmFromSearch(search: string): UtmFields | undefined {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const utm: UtmFields = {};
  const source = clip(params.get("utm_source"), 80);
  const medium = clip(params.get("utm_medium"), 80);
  const campaign = clip(params.get("utm_campaign"), 120);
  const content = clip(params.get("utm_content"), 120);
  const term = clip(params.get("utm_term"), 120);
  if (source) utm.source = source;
  if (medium) utm.medium = medium;
  if (campaign) utm.campaign = campaign;
  if (content) utm.content = content;
  if (term) utm.term = term;
  return Object.keys(utm).length ? utm : undefined;
}

export function sourcePageFromLocation(pathname: string, search: string): string | undefined {
  const path = pathname.trim() || "/";
  const suffix = search && search !== "?" ? search.slice(0, 400) : "";
  const combined = `${path}${suffix}`.slice(0, 500);
  return combined || undefined;
}
