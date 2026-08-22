export const PORTFOLIO_PROJECTS_QUERY = /* groq */ `
*[_type == "project"
  && !(_id in path("drafts.**"))
  && defined(slug.current)
  && defined(cover.asset)
  && count(gallery) > 0
] | order(orderRank asc) {
  titleUa,
  titleEn,
  "slug": slug.current,
  category,
  locationKey,
  descriptionUa,
  descriptionEn,
  area,
  workTypeUa,
  workTypeEn,
  durationUa,
  durationEn,
  year,
  coverPosition,
  span,
  orderRank,
  "coverUrl": cover.asset->url,
  "coverLqip": cover.asset->metadata.lqip,
  gallery[] {
    fit,
    objectPosition,
    thumbPosition,
    "src": image.asset->url,
    "lqip": image.asset->metadata.lqip,
    "video": video.asset->url
  }
}
`;
