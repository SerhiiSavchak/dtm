"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  projectMedia,
  type Project,
  type ProjectMedia,
} from "@/data/projects";
import { useDictionary } from "@/lib/i18n/locale-context";
import { dossierFacts } from "@/lib/portfolio/labels";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-slots";
import { useStageCrossfade } from "@/lib/media/stage-crossfade";
import { preloadSiteImage } from "@/lib/media-preload";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { MediaImage } from "./media-image";
import { PosterVideo } from "./poster-video";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusable(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
}

function mediaKey(item: ProjectMedia) {
  return item.video ? `${item.src}::${item.video}` : item.src;
}

function resolveCopy(value: string, placeholder: string) {
  return value.startsWith("[") ? placeholder : value;
}

function descriptionParagraphs(
  raw: string | string[] | undefined,
  placeholder: string
) {
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : [raw];
  return parts.map((part) => resolveCopy(part, placeholder)).filter(Boolean);
}

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}


function DossierStage({
  item,
  alt,
  sizes,
  reduced,
  onBusyChange,
}: {
  item: ProjectMedia;
  alt: string;
  sizes: string;
  reduced: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const {
    shown,
    incoming,
    incomingOn,
    showLoader,
    busy,
    onIncomingReady,
    onIncomingFail,
  } = useStageCrossfade(item, mediaKey, reduced);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  return (
    <div className="project-dossier-stage" aria-busy={busy || undefined}>
      <div className="project-dossier-layer is-shown" data-fit={shown.fit}>
        <DossierFrame item={shown} alt={alt} sizes={sizes} priority />
      </div>
      {incoming ? (
        <div
          className={`project-dossier-layer ${incomingOn ? "is-shown" : ""}`}
          data-fit={incoming.fit}
        >
          <DossierFrame
            item={incoming}
            alt={alt}
            sizes={sizes}
            priority
            onReady={onIncomingReady}
            onFail={onIncomingFail}
          />
        </div>
      ) : null}
      <span
        className={`media-stage-loader project-dossier-wait ${showLoader ? "is-on" : ""}`}
        aria-hidden
      />
    </div>
  );
}

function DossierFrame({
  item,
  alt,
  sizes,
  priority,
  onReady,
  onFail,
}: {
  item: ProjectMedia;
  alt: string;
  sizes: string;
  priority?: boolean;
  onReady?: () => void;
  onFail?: () => void;
}) {
  const fitClass = item.fit === "contain" ? "object-contain" : "object-cover";
  const position = { objectPosition: item.objectPosition } as CSSProperties;

  if (item.video) {
    return (
      <PosterVideo
        poster={item.src}
        posterLqip={item.lqip}
        mp4={item.video}
        alt={alt}
        sizes={sizes}
        imageClassName={fitClass}
        videoClassName={`${fitClass} project-dossier-video`}
        objectPosition={item.objectPosition}
        active
        preload="metadata"
        quality={IMAGE_QUALITY.feature}
        onPosterReady={onReady}
        onVideoReady={onReady}
      />
    );
  }

  return (
    <MediaImage
      src={item.src}
      alt={alt}
      lqip={item.lqip}
      fill
      quality={IMAGE_QUALITY.feature}
      sizes={sizes}
      priority={priority}
      className={fitClass}
      style={position}
      onReady={onReady}
      onError={() => onFail?.()}
    />
  );
}

export function ProjectDossier({
  slug,
  projects,
  onClose,
  onNavigate,
}: {
  slug: string;
  projects: Project[];
  onClose: () => void;
  onNavigate: (next: string) => void;
}) {
  const t = useDictionary().projects;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);
  const titleId = useId();
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [stageBusy, setStageBusy] = useState(false);
  const [activeSlug, setActiveSlug] = useState(slug);
  if (activeSlug !== slug) {
    setActiveSlug(slug);
    setMediaIndex(0);
  }

  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const project = projects[projectIndex] ?? projects[0];
  const media = projectMedia(project);
  const safeIndex = Math.min(mediaIndex, Math.max(0, media.length - 1));
  const current = media[safeIndex] ?? media[0];
  const lastMedia = media.length - 1;
  const canPrevProject = projectIndex > 0;
  const canNextProject = projectIndex < projects.length - 1;
  const stageSizes = IMAGE_SIZES.dossierStage;

  const title = project.title;
  const paragraphs = descriptionParagraphs(
    project.description,
    t.descriptionPlaceholder
  );

  const facts = dossierFacts(project, t);

  const mediaAlt =
    project.objectType && t.objectTypes[project.objectType]
      ? `DTM: ${t.objectTypes[project.objectType]}`
      : `DTM: ${t.categories[project.category]}`;

  const goMedia = useCallback(
    (next: number) => {
      setMediaIndex(Math.max(0, Math.min(lastMedia, next)));
    },
    [lastMedia]
  );

  const preloadCover = useCallback(
    (index: number) => {
      const cover = projectMedia(projects[index])[0]?.src;
      if (cover) {
        void preloadSiteImage(cover, {
          sizes: stageSizes,
          quality: IMAGE_QUALITY.feature,
        });
      }
    },
    [projects, stageSizes]
  );

  useEffect(() => {
    originRef.current = document.activeElement as HTMLElement | null;
    lockScroll();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      unlockScroll();
      originRef.current?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [slug]);

  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>(
      ".project-dossier-thumb.is-active"
    );
    if (!strip || !active) return;
    const pad = 8;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    const viewLeft = strip.scrollLeft;
    const viewRight = viewLeft + strip.clientWidth;
    if (left >= viewLeft + pad && right <= viewRight - pad) return;
    active.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [safeIndex, slug, reduced]);

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goMedia(safeIndex + 1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goMedia(safeIndex - 1);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable(root);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goMedia, onClose, safeIndex]);

  const goEstimate = () => {
    const reduce = getReduced();
    onClose();
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById("estimate")?.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "start",
          });
          window.history.pushState(null, "", "#estimate");
        });
      });
    }, 0);
  };

  useEffect(() => {
    const list = projectMedia(project);
    const srcs = [
      list[safeIndex]?.src,
      list[safeIndex - 1]?.src,
      list[safeIndex + 1]?.src,
      projectIndex > 0
        ? projectMedia(projects[projectIndex - 1])[0]?.src
        : undefined,
      projectIndex < projects.length - 1
        ? projectMedia(projects[projectIndex + 1])[0]?.src
        : undefined,
    ].filter((src): src is string => Boolean(src));

    srcs.forEach((src) => {
      void preloadSiteImage(src, {
        sizes: stageSizes,
        quality: IMAGE_QUALITY.feature,
      });
    });
  }, [project, projectIndex, projects, safeIndex, stageSizes]);

  if (typeof document === "undefined" || !project || !current) return null;

  return createPortal(
    <div
      className="project-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="project-dossier"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="project-dossier-media">
          <div
            className="project-dossier-stage-wrap"
            onTouchStart={(event) => {
              touchX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchX.current == null) return;
              const dx = (event.changedTouches[0]?.clientX ?? 0) - touchX.current;
              if (dx < -48) goMedia(safeIndex + 1);
              if (dx > 48) goMedia(safeIndex - 1);
              touchX.current = null;
            }}
          >
            <DossierStage
              item={current}
              alt={mediaAlt}
              sizes={stageSizes}
              reduced={reduced}
              onBusyChange={setStageBusy}
            />
            {media.length > 1 ? (
              <p className="project-dossier-counter" aria-live="polite">
                {String(safeIndex + 1).padStart(2, "0")} /{" "}
                {String(media.length).padStart(2, "0")}
              </p>
            ) : null}
          </div>

          {media.length > 1 ? (
            <div ref={stripRef} className="project-dossier-filmstrip">
              {media.map((item, index) => (
                <button
                  key={`${index}:${mediaKey(item)}`}
                  type="button"
                  aria-label={
                    item.video
                      ? `${t.frame} ${index + 1}, ${t.videoKind}`
                      : `${t.frame} ${index + 1}`
                  }
                  aria-current={index === safeIndex ? "true" : undefined}
                  className={`project-dossier-thumb ${
                    index === safeIndex ? "is-active" : ""
                  }${index === safeIndex && stageBusy ? " is-pending" : ""}`}
                  onClick={() => goMedia(index)}
                >
                  <MediaImage
                    src={item.src}
                    alt=""
                    lqip={item.lqip}
                    fill
                    quality={IMAGE_QUALITY.thumb}
                    sizes={IMAGE_SIZES.dossierThumb}
                    loading={Math.abs(index - safeIndex) <= 1 ? "eager" : "lazy"}
                    className="object-cover"
                    style={{
                      objectPosition: item.thumbPosition ?? item.objectPosition,
                    }}
                  />
                  {item.video ? (
                    <span className="project-dossier-thumb-video" aria-hidden />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="project-dossier-info">
          <header className="project-dossier-utility">
            <p
              className="project-dossier-index"
              aria-label={`${projectIndex + 1} / ${projects.length}`}
            >
              {String(projectIndex + 1).padStart(2, "0")}
              <span aria-hidden> · </span>
              {String(projects.length).padStart(2, "0")}
            </p>
            <button
              ref={closeRef}
              type="button"
              className="project-dossier-close"
              aria-label={t.close}
              onClick={onClose}
            >
              <span className="project-dossier-close-label">{t.close}</span>
              <span aria-hidden>✕</span>
            </button>
          </header>

          <div ref={bodyRef} className="project-dossier-body">
            <h2 id={titleId} className="project-dossier-title">
              {title}
            </h2>

            {facts.length > 0 ? (
              <dl className="project-dossier-facts">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className={`project-dossier-fact${fact.wide ? " is-wide" : ""}`}
                  >
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {paragraphs.length > 0 ? (
              <div className="project-dossier-copy">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              className="project-dossier-cta"
              onClick={goEstimate}
            >
              <span>{t.discussCta}</span>
              <span aria-hidden>→</span>
            </button>
          </div>

          <footer className="project-dossier-nav">
            <button
              type="button"
              className="project-dossier-nav-btn"
              disabled={!canPrevProject}
              onMouseEnter={() => canPrevProject && preloadCover(projectIndex - 1)}
              onFocus={() => canPrevProject && preloadCover(projectIndex - 1)}
              onClick={() =>
                canPrevProject && onNavigate(projects[projectIndex - 1].slug)
              }
            >
              ← {t.prev}
            </button>
            <button
              type="button"
              className="project-dossier-nav-btn is-next"
              disabled={!canNextProject}
              onMouseEnter={() => canNextProject && preloadCover(projectIndex + 1)}
              onFocus={() => canNextProject && preloadCover(projectIndex + 1)}
              onClick={() =>
                canNextProject && onNavigate(projects[projectIndex + 1].slug)
              }
            >
              {t.next} →
            </button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
