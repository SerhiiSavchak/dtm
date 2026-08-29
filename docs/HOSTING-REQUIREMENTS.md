# Технічні вимоги до хостингу (підготовка до вибору провайдера)

Не мігруємо хостинг у цій фазі. Чеклист для наступного порівняння **чинної** документації провайдерів.

## Обов’язкові можливості

| Вимога | ДTM зараз |
| --- | --- |
| Next.js | **16.3.0** (App Router) |
| RSC | Так: головна збирає Portfolio / In-progress на сервері |
| Server Route | `POST /api/leads` (`nodejs` runtime); аліас `POST /api/estimate` |
| Node-сумісне виконання | Так: ліди, Sanity fetch, ISR options |
| Env / secrets | Імена в `.env.example`; без секретів у клієнтському бандлі (крім `NEXT_PUBLIC_*`) |
| Custom domain + HTTPS | Потрібні для бойового сайту |
| Sanity images | `next.config.ts` → `images.remotePatterns`: `cdn.sanity.io/images/**` |
| Image optimization | `next/image` (AVIF/WebP). Якщо хост не оптимізує — прийнятна альтернатива: прямі Sanity CDN URL без оптимізатора, але треба явно перевірити |
| ISR / revalidate | Production: `revalidate: 60` у `sanityFetchOptions`. Прийнятна альтернатива: SSR на кожен запит або on-demand revalidate |
| Комерційне використання на free-tier | **Окремо перевірити умови провайдера** (Hobby Vercel на дату аудиту — не для комерції) |

Статичний HTML-хост **не** підходить: є `/api/leads` і серверний Sanity fetch.

Відео CMS іде з `cdn.sanity.io/files` (не через `next/image`).

## Не вимагати

Redis, окрема БД, платна черга, платний backup, окремий image CDN.

## Як порівнювати провайдера (наступна фаза)

1. Чи дозволена комерція на безкоштовному плані (офіційні Fair Use).
2. Чи є Node-функції для `/api/leads` (timeout ≥ 10 с бажано).
3. Чи є env для Production.
4. Чи збирається `next build` як є, без адаптера **або** з підтримуваним адаптером Next 16.
5. Ліміти bandwidth / image transforms vs очікуваний трафік DTM.
6. Custom domain + HTTPS без обов’язкової абонплати.
