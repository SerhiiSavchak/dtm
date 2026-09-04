# Чекліст передачі проєкту клієнту

Нічого з цього списку ще не виконано. Секрети в документ не записувати.

Повна операційна інструкція: [DTM-AUTONOMY-RUNBOOK.md](./DTM-AUTONOMY-RUNBOOK.md).

## Поточний стан (аудит, не передача)

| Сервіс | Зараз (за репозиторієм) | Має стати | Що зробити пізніше |
| --- | --- | --- | --- |
| Sanity CMS | Проєкт `NEXT_PUBLIC_SANITY_PROJECT_ID` у env; датасети `development` (локально) і запланований `production`; Studio на `/admin`; публічні читання **без** серверного токена | Організація / логін власника DTM, клієнт — адміністратор | Запросити клієнта, перевірити логін, потім забрати зайві ролі розробника. Датасет production не чіпати в цій фазі |
| GitHub | `https://github.com/SerhiiSavchak/dtm.git` | Репозиторій / org клієнта з повною історією | Transfer репозиторію **або** клієнтський org + import з історією; перепідключити хостинг |
| Хостинг | Локальний лінк `.vercel/project.json`: проєкт `dtm` на Vercel (org/team у файлі лінка). Публічний fallback URL у коді: `https://dtm-chi.vercel.app` | Акаунт клієнта. **Hobby Vercel за поточними Fair Use — не для комерційного сайту ремонту** (перевірити [офіційні Fair Use](https://vercel.com/docs/limits/fair-use-guidelines) на дату передачі) | Або Pro (платно), або безкоштовний хост, чиї **чинні** умови дозволяють комерційний сайт + Node API (`/api/leads`) |
| Домен / DNS | У репозиторії реєстратор **не** зафіксований | Клієнт: реєстратор, DNS, листи про продовження | Не знімати DNS розробника, доки новий хостинг і записи підтверджені |
| Telegram (заявки) | Сервер: клієнтський бот (`TELEGRAM_BOT_TOKEN`), primary чат клієнта (`TELEGRAM_PRIMARY_CHAT_ID`), опційна копія розробника (`TELEGRAM_COPY_CHAT_IDS`). Успіх Telegram = **primary**. Збій копії не валить заявку | Бот і чат клієнта + `/start` у кожному private chat | Оновити env; перевірити одну заявку в чат клієнта і копію розробника |
| Email (Resend) | **Опційно.** Primary: `LEAD_EMAIL_TO` (`dtm.remont@gmail.com`). Копія: `LEAD_EMAIL_COPY_TO`. Якщо налаштований і Telegram впав — заявка все одно `200`. Збій копії не валить primary | Лише якщо клієнт хоче пошту | `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, primary + опційна копія |
| Telegram (публічне посилання) | Дефолт у коді: `https://t.me/+380931230505` (`PUBLIC_TELEGRAM_URL`). Це **не** Bot API | Публічний username клієнта, якщо phone-discovery вимкнено | `NEXT_PUBLIC_TELEGRAM_URL` або зміна дефолту в `lib/leads/labels.ts` |
| CMS snapshot | `npm run cms:snapshot` → `data/generated/*.snapshot.json` | Оновлювати після публікацій, комітити з деплоєм | Last-known-good при аутеджі Sanity |
| Sanity backup | `npm run sanity:backup` → `backups/` (не в git) | Регулярний export з ассетами | Restore лише свідомо, `--replace` руйнівний |
| Instagram / телефон | Дефолт Instagram у коді; телефон — `#contacts` якщо немає env | Посилання клієнта | `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_PHONE_URL` |
| Канонічний URL сайту | `NEXT_PUBLIC_SITE_URL` або fallback `https://dtm-chi.vercel.app` | Бойовий домен клієнта | Env на хостингу + sitemap/robots |
| Analytics / Pixel / Maps / Search Console | **Немає в коді** | Лише за бажанням клієнта, без обов’язкової плати | Не додавати «за замовчуванням» |
| Шрифти | `next/font/google` (Inter Tight, JetBrains Mono) — підтягуються **на білді**, відвідувачу окремий Google-акаунт не потрібен | Без змін | — |
| Медіа CMS | `cdn.sanity.io` (фото + файли відео). Локальний fallback: `/images`, `/videos` | Клієнт не завантажує сирі 4K/500MB відео без потреби | Правила в runbook |

## Порядок майбутньої передачі (не виконувати зараз)

Див. runbook, розділ «Порядок передачі» і «Rollback».

Коротко: спочатку акаунти клієнта й **підтверджений** доступ, потім секрети й DNS, **в кінці** відкликання доступу розробника.

## Нульова обов’язкова абонплата

Окрім продовження домену: Telegram Bot API без абонплати; Sanity Free при дотриманні квот; GitHub безкоштовний тариф; Resend не обов’язковий.

**Умова хостингу:** чинний безкоштовний план провайдера має **дозволяти комерційний** сайт з API заявок. Hobby Vercel на дату аудиту (Fair Use, оновлення сторінки ~2026-07-29) цього не гарантує.

## Залежності від розробника (поки не передано)

CMS-адмін, git origin, Vercel-лінк, DNS (якщо в нього), Telegram-бот/чат, опційний Resend, дефолтний публічний Telegram username у коді.
