export const IN_PROGRESS_FRAMES_QUERY = /* groq */ `
*[_type == "inProgressFrame"
  && !(_id in path("drafts.**"))
  && defined(frameId.current)
  && (defined(still.asset) || defined(poster.asset) || defined(video.asset))
] | order(orderRank asc) {
  _id,
  "frameId": frameId.current,
  mediaType,
  objectPosition,
  orderRank,
  "src": coalesce(poster.asset->url, still.asset->url),
  "lqip": coalesce(poster.asset->metadata.lqip, still.asset->metadata.lqip),
  "video": video.asset->url
}
`;

export const IN_PROGRESS_BOARD_QUERY = /* groq */ `
*[_id == "inProgressBoard" && !(_id in path("drafts.**"))][0] {
  "boardIds": blinds[]->frameId.current
}
`;

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
  objectType,
  locationUa,
  locationEn,
  locationKey,
  descriptionUa,
  descriptionEn,
  area,
  rooms,
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
