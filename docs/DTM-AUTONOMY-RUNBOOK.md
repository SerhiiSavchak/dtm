# DTM — runbook автономії (без секретів)

Операційна пам’ятка для власника або наступного розробника. Значення токенів сюди не записувати.

Пов’язано: [CLIENT-HANDOFF-CHECKLIST.md](./CLIENT-HANDOFF-CHECKLIST.md), [CMS-GUIDE-UA.md](./CMS-GUIDE-UA.md).

---

## Репозиторій (орієнтир)

| Шлях | Призначення |
| --- | --- |
| `app/` | Next.js App Router: головна, `/admin`, API лідів |
| `components/` | UI: портфоліо, dossier, in-progress, калькулятор |
| `lib/` | Sanity fetch/map, fallback, leads, media, i18n |
| `data/` | Legacy hardcoded fallback + `generated/*.snapshot.json` (LKG) |
| `sanity/` | Studio schema, structure, slugify |
| `scripts/` | backup, snapshot, migrate/import, verify, QA |
| `e2e/` | Playwright регресії |
| `public/` | Hero/in-progress fallback медіа (не client source) |
| `/new-materials/` | **gitignored** — вихідні файли клієнта для імпорту (поза `public/`) |
| `backups/` | **gitignored** — `npm run sanity:backup` |
| `tmp/` | **gitignored** — тимчасові маніфести імпорту |

---

Ціль після передачі: **клієнт** володіє Sanity-проєктом, git, хостингом, доменом, Telegram-ботом і (якщо є) Resend. Розробник — зайвий collaborator, якого можна прибрати.

Зараз (за репозиторієм, серпень 2026): git `SerhiiSavchak/dtm`; локально проєкт злінковано з Vercel (`dtm`); Sanity project id і dataset задаються публічними env; заявки вимагають Telegram env на сервері.

---

## CMS: вхід і відновлення доступу

1. Відкрити `https://<домен>/admin`.
2. Увійти **своїм** Google / GitHub / email через екран Sanity (не спільний пароль розробника).
3. Для щоденного контенту достатньо ролі **Editor**: Studio, правки проєктів/кадрів, upload фото/відео, Publish, порядок, board. Administrator не обов’язковий для цього. Розробника з проєкту **не прибирати** до фінальної передачі.
4. Запросити клієнта (`dtm.remont@gmail.com`) з [manage.sanity.io](https://www.sanity.io/manage) → проєкт DTM (`l1d717lp`) → **Members** → **Invite** → email клієнта → роль **Editor** → клієнт приймає лист і логіниться на `/admin`.
5. Viewer — лише перегляд, без Publish. Contributor на Free-плані може не дати Publish — тоді Editor.
6. Втрачений пристрій: вийти в Studio + у провайдера входу змінити пароль; за потреби прибрати користувача в manage.
7. Кілька комп’ютерів: той самий Sanity-логін; сесії нативні Sanity, окремого DTM-логіну немає.

Публічний сайт читає **опубліковані** документи без серверного Sanity-токена. Токен CLI (`sanity login` / user token) потрібен лише для Studio-сесії людини та для скриптів міграції/QA, не для відвідувачів.

Якщо проєкт Sanity втрачено (акаунт власника зник і немає другого Admin): контент з API недоступний для правок, доки Sanity Support / новий проєкт + import бекапу. Тому після фінальної передачі — **два Admin** і файл експорту. На етапі запуску доступ розробника зберігаємо.

---

## Хостинг

Сайт — Next.js (App Router). Потрібні:

- білд `npm run build` (Node);
- публічні сторінки (ISR головної ~60 с у production через Sanity fetch + on-demand revalidate після Publish);
- Node-маршрут `POST /api/leads` (і застарілий аліас `/api/estimate`) для калькулятора.

Технічно підходить будь-який хост з Node-функціями. Поточне підключення в робочій копії — Vercel.

Перед продакшеном на **безкоштовному** плані перевірити **чинні** умови провайдера: комерційний ремонтний сайт + ліди. Hobby Vercel: Fair Use обмежує комерційне використання ([документація](https://vercel.com/docs/limits/fair-use-guidelines)). Це треба підтвердити на дату handoff, не з цього файлу як з вічного правила.

Env на хостингу: імена з `.env.example`. Після зміни секретів — новий деплой.

Технічні вимоги до будь-якого майбутнього хоста: [HOSTING-REQUIREMENTS.md](./HOSTING-REQUIREMENTS.md).

---

## Домен

Обов’язкова плата: **продовження домену**.

Має належати клієнту: акаунт реєстратора, DNS, email попереджень.

Типові записи (уточнити в панелі хостингу):

- `A` / `AAAA` або `CNAME` на хост;
- `www` → apex або навпаки;
- після кастомного домену Sanity CORS: origin сайту **з credentials**.

Не змінювати DNS, доки новий хост віддає сайт по preview-URL.

---

## Заявки (Telegram / email)

Успіх форми = **хоча б один налаштований канал доставив** заявку на **primary** одержувача. Відвідувач не бачить, який саме.

Неналаштований канал не є помилкою. Якщо **жоден** канал не налаштований або всі налаштовані primary впали → `503 delivery_failed`.

**Telegram:** бот продакшену = бот клієнта (`TELEGRAM_BOT_TOKEN`). Primary чат = клієнт (`TELEGRAM_PRIMARY_CHAT_ID`). Копія розробника = `TELEGRAM_COPY_CHAT_IDS` (ті самі незалежні sendMessage). Збій копії → лог `telegram_copy_failed`, заявка лишається успішною, якщо клієнт отримав.

**Email:** primary = `LEAD_EMAIL_TO` (інбокс клієнта). Копія = `LEAD_EMAIL_COPY_TO`. Два незалежні листи Resend. Збій копії → лог `email_copy_failed`, не валить primary.

Приватний Telegram-чат отримує повідомлення лише після `/start` саме **клієнтського** бота.

| Telegram | Email | Результат |
| --- | --- | --- |
| sent | sent | `200` |
| sent | failed | `200` |
| failed | sent | `200` |
| failed | failed | `503` |
| sent | not configured | `200` |
| failed | not configured | `503` |
| not configured | sent | `200` |
| not configured | failed | `503` |
| not configured | not configured | `503` |

Публічне `t.me/...` у футері — **інший** канал, ніж бот заявок.

### Ліди не приходять у Telegram

1. Перевірити, що форма на **бойовому** домені, не на чужому origin (API відхиляє чужий `Origin`).
2. У логах хостингу події `telegram_send_failed` / `unconfigured` / `rejected` / `timeout`. Копія: `telegram_copy_failed` (не валить заявку).
3. BotFather: бот клієнта не видалений, `/token` актуальний.
4. Бот **є учасником** цільового чату/групи; для private chat кожен одержувач має зробити `/start` клієнтському боту.
5. `TELEGRAM_PRIMARY_CHAT_ID` — **число** (не `@username`). Для супергрупи часто `-100…`.
6. Якщо є топіки: `TELEGRAM_MESSAGE_THREAD_ID` лише цифри, інакше ігнорується (лише primary).
7. За потреби BotFather → Revoke → новий токен → оновити **лише** `TELEGRAM_BOT_TOKEN` на хостингу → Redeploy.
8. Надіслати тестову заявку з калькулятора.

Копія розробника (`TELEGRAM_COPY_CHAT_IDS`) не замінює primary клієнта.

### Email

Не обов’язковий. Якщо квота Resend вичерпана — листи падають, **форма лишається успішною** при живому Telegram. Ключ крутить власник Resend-акаунта. Primary інбокс клієнта; копія розробника окремим листом.

---

## Секрети (імена, без значень)

| Ім’я | Сервіс | Секрет? | Обов’язково | Хто володіє | Як оновити | Якщо немає |
| --- | --- | --- | --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API | так | для лідів | клієнт (BotFather) | Revoke + новий токен + redeploy | заявки 503 |
| `TELEGRAM_PRIMARY_CHAT_ID` | Telegram | ні* | для лідів (primary клієнт) | клієнт | з `@userinfobot` / API getUpdates | заявки 503 |
| `TELEGRAM_COPY_CHAT_IDS` | Telegram | ні* | ні (копія розробника) | розробник / клієнт | comma-separated numeric ids; `/start` клієнтського бота | копія skipped |
| `TELEGRAM_MESSAGE_THREAD_ID` | Telegram | ні | ні | клієнт | прибрати або виправити id топіка | повідомлення не в топік |
| `RESEND_API_KEY` | Resend | так | ні | клієнт | новий ключ у панелі Resend | email skipped |
| `LEAD_EMAIL_TO` | Resend | ні | лише з email | клієнт | змінити адресу | email skipped |
| `LEAD_EMAIL_COPY_TO` | Resend | ні | ні (копія) | розробник | окремий лист; збій не валить primary | копія skipped |
| `LEADS_FROM_EMAIL` | Resend | ні | лише з email | клієнт | verified domain / onboarding@ | email skipped |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity | ні | для CMS+сайту з CMS | клієнт (проєкт) | новий проєкт = новий id + CORS | hardcoded fallback портфоліо / in-progress |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity | ні | так | клієнт | `production` / `development` | код падає на `"production"` якщо порожньо |
| `NEXT_PUBLIC_SITE_URL` | сайт | ні | бажано | клієнт | канонічний https | sitemap/OG на vercel.app fallback |
| `NEXT_PUBLIC_TELEGRAM_URL` | CTA | ні | ні | клієнт | https посилання | дефолт у коді |
| `NEXT_PUBLIC_INSTAGRAM_URL` | CTA | ні | ні | клієнт | https | дефолт у коді |
| `NEXT_PUBLIC_PHONE_URL` | CTA | ні | ні | клієнт | `tel:` або якір | `#contacts` |
| `SANITY_AUTH_TOKEN` | Sanity CLI | так | **не для продакшен-сайту** | людина в CLI | `sanity login` | скрипти seed/qa/migrate не пишуть |
| `SANITY_REVALIDATE_SECRET` | Next on-demand ISR | так | для миттєвого оновлення CMS на проді | клієнт / хостинг | згенерувати довгий random → Vercel env + Sanity webhook header | publish лишається на ISR ~60 с |
| `VERCEL_OIDC_TOKEN` | Vercel CLI | так | ні для застосунку | хто лінкав CLI | перелінк | ігнорувати в app |

\*Chat id не «пароль», але не світити публічно.

**Не потрібен** write-токен Sanity в Vercel для публічного читання, якщо датасет публічний.

---

## Бекап CMS (безкоштовно, вручну)

Раз на місяць або після великої правки портфоліо/відео. Експорт рахується в API-квоту Sanity.

**Перед експортом:** переконайтесь, що цільовий dataset саме той, який потрібен. За замовчуванням скрипт експортує лише `development`. Інший dataset (у т.ч. `production`) — лише з `ALLOW_NON_DEVELOPMENT_BACKUP=1` (це **read-only** export, без мутацій).

```bash
# Перевірити env (має бути development для звичайної роботи)
# NEXT_PUBLIC_SANITY_DATASET=development

npm run sanity:backup
# архів: backups/dtm-development-<timestamp>.tar.gz (gitignored), з ассетами
# не перезаписує існуючий файл з тим самим ім'ям

# Лише якщо свідомо потрібен read-only export іншого dataset:
# ALLOW_NON_DEVELOPMENT_BACKUP=1 npm run sanity:backup -- production
```

Перевірка читабельності архіву **без** restore:

```bash
npm run test:backup-integrity
```

Порівнює document ID з live `development` GROQ. **Не** виконує `dataset import`.

### Restore (руйнівний)

**НЕ запускати «щоб перевірити» на активному development або production.**

`--replace` перезаписує документи з тими самими id у **цільовому** dataset.

Обов’язковий safety check перед будь-яким import:

1. Dataset у команді = навмисна ціль (зазвичай одноразовий disposable dataset, не `production`).
2. Архів з іменем `dtm-<той-самий-dataset>-…` або явно звірений вміст.
3. Немає секретів у команді / логах (токен лише через `sanity login` / локальний CLI).

```bash
# ПРИКЛАД — тільки на disposable dataset після окремого рішення:
# npx sanity dataset import backups/dtm-development-YYYY-MM-DD.tar.gz <disposable> --replace
#
# НІКОЛИ не ганяти --replace проти активного development «для QA»
# і НІКОЛИ проти production у цій фазі розробки.
```

Схема Studio — у git. Права користувачів manage — не в експорті.

## Last-known-good snapshot (сайт без живого Sanity)

Ієрархія джерел (атомарно, без змішування):

1. **Валідний live Sanity** → published GROQ
2. **Недоступний / порожній / невалідний Sanity** → `data/generated/*.snapshot.json` (якщо version і структура валідні)
3. **Невалідний / відсутній snapshot** → legacy hardcoded (`data/projects.ts`, `data/in-progress-scenes.ts`)

Коли ганяти `cms:snapshot`:

- після **прийнятих** реальних змін CMS на `development`;
- перед комітом/деплоєм, щоб last-known-good у git відповідав опублікованому контенту;
- не після зламаного/порожнього CMS (скрипт **abort** і не затирає попередні файли).

```bash
# NEXT_PUBLIC_SANITY_DATASET має бути development
npm run cms:snapshot
```

Читає **published** GROQ (без мутацій) і пише `data/generated/portfolio.snapshot.json` та `in-progress.snapshot.json`. Порожній або битий CMS **не** затирає попередній валідний файл.

Симуляція аутеджу Sanity (лише non-production): заголовок `x-dtm-simulate-sanity-failure: 1` → сайт читає snapshot.

Після відновлення Sanity API знову читає live; snapshot лишається запасним.

---

## Публікація в CMS → оновлення сайту (без redeploy)

**Зміни контенту в Sanity — це дані, не код.** Новий Vercel deploy для Publish **не потрібен**. Deploy потрібен лише коли змінюється застосунок (код, env, конфіг).

### Як це працює для клієнта

1. Редагування в Studio (`/admin`).
2. Натискання **Publish** (або Unpublish / Delete).
3. Sanity надсилає webhook `POST https://<домен>/api/revalidate` з тілом документа.
4. Сервер перевіряє секрет `SANITY_REVALIDATE_SECRET` і скидає кеш Next.js за тегами:
   - `project`, `projectMedia` → тег `sanity-portfolio`
   - `inProgressFrame`, `inProgressBoard` → тег `sanity-in-progress`
5. Наступний запит відвідувача до головної знову читає **опублікований** Sanity (з LKG fallback, якщо API недоступний).

Очікувана затримка після Publish на проді: **кілька секунд** (webhook + один холодний fetch), не хвилини.

### Резервний шлях (якщо webhook не спрацював)

ISR `revalidate: 60` лишається увімкненим. Сайт **сам оновиться протягом ~60 с** навіть без webhook. Це страховка, не основний шлях.

### Локальна розробка

`npm run dev` використовує `cache: "no-store"` і Sanity API без CDN — Publish видно після refresh **без webhook**. Webhook на localhost не потрібен.

Ручний тест endpoint (лише локально, після `SANITY_REVALIDATE_SECRET` у `.env.local`):

```bash
curl -sS -X POST http://localhost:3000/api/revalidate \
  -H "content-type: application/json" \
  -H "x-dtm-revalidate-secret: <ваш-локальний-секрет>" \
  -d '{"_type":"project","dataset":"development"}'
```

### Налаштування webhook у Sanity (після deploy коду)

Виконує розробник / власник у [manage.sanity.io](https://manage.sanity.io) → проєкт → **API** → **Webhooks** → **Create webhook**:

| Поле | Значення |
| --- | --- |
| Name | `DTM production revalidate` |
| URL | `https://<production-domain>/api/revalidate` |
| Dataset | `production` (або ваш бойовий dataset) |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["project","projectMedia","inProgressFrame","inProgressBoard"]` |
| Projection | `{_type, _id, "dataset": sanity::dataset()}` |
| HTTP method | POST |
| API version | `2025-08-22` (або поточний у проєкті) |
| Secret / Headers | Header `x-dtm-revalidate-secret: <значення SANITY_REVALIDATE_SECRET з Vercel>` |

На Vercel додати **той самий** `SANITY_REVALIDATE_SECRET` у Production env і зробити redeploy **один раз** після merge цього коду. Далі Publish не вимагає redeploy.

**Не вставляти секрет у git, runbook або чат.** Лише ім’я змінної в `.env.example`.

### Sanity CDN

Production читає через `useCdn: true` для швидкості. Після скидання Next cache наступний fetch іде в Sanity CDN; для published perspective затримка зазвичай мінімальна. Вимикати CDN не потрібно.

---

## Медіа (безкоштовний тариф Sanity)

Не вантажити в CMS сирі iPhone-відео на сотні МБ, якщо вистачить стисненого H.264 720p/1080p.

Фото: JPEG як у поточних Telegram-експортах; не дублювати 4K PNG «про запас».

Відео на сайті з Sanity йде з `cdn.sanity.io/files` (не через `next/image`). Великі файли б’ють **bandwidth** Sanity (на Free при вичерпанні публічна роздача може блокуватися до кінця місяця — перевірити [plans](https://www.sanity.io/docs/platform-management/plans-and-payments) на дату handoff).

Hero/kitchen fallback лежать у git (`/videos`, `/images`) і їдуть з хостингу.

---

## Сценарії відновлення

| Що сталося | Що робити |
| --- | --- |
| Аутедж Sanity (API/CDN) | Нічого не імпортувати. Сайт на last-known-good snapshot. Після відновлення API знову live. |
| Випадково видалили роботу в Studio | History/restore в Sanity, якщо ще доступна; інакше import бекапу лише в **disposable** dataset для перевірки, потім обережний restore у development. Не `--replace` «наосліп» у production. |
| Зламаний / застарілий snapshot у git | Не деплоїти битий JSON. Відновити попередній коміт snapshot або `cms:snapshot` з валідного live development. Сайт тимчасово піде на hardcoded, якщо snapshot невалідний. |
| Втрата доступу до акаунту Sanity | Відновити доступ (invite / owner). Контент у dataset лишається; бекап у `backups/` + snapshot у git — запасний канал. Не створювати новий проєкт «з нуля» без плану міграції. |
| Квота API/CDN/bandwidth Sanity | Зачекати скидання місяця або зменшити відео; повний fallback (snapshot → hardcoded), без часткового змішування джерел |
| Хостинг пауза / ліміт | Інший акаунт/провайдер + той самий git + ті самі env |
| Збій білду | Логи хостингу; `npm run build` локально; не чіпати DNS |
| Токен бота відкликано | BotFather → новий токен → env → redeploy |
| Бот вигнаний з чату | Додати знову; chat id той самий або новий |

---

## Порядок передачі (майбутнє)

1. Клієнт створює: Sanity (або приймає invite), GitHub/org, хостинг, Telegram BotFather, опційно Resend, контролює реєстратор домену.
2. Invite клієнта в Sanity як Admin; клієнт логіниться на `/admin`; перевірка публікації на **development**, не production.
3. Transfer git або клієнтський репозиторій з історією; клієнт підтверджує clone.
4. Клієнтський хостинг + env (копія імен, нові секрети клієнта) + успішний preview-деплой.
5. Клієнтські Telegram (і Resend, якщо треба); тестова заявка на preview.
6. DNS на новий хост **після** зеленого preview; CORS Sanity на бойовий origin.
7. `NEXT_PUBLIC_SITE_URL` = бойовий домен; редеплой.
8. Клієнт сам логіниться, деплоїть з git, експортує dataset.
9. Прибрати розробника з Sanity Admin, Vercel, git, DNS, BotFather (якщо був співвласник).

## Rollback під час передачі

- Не відкликати розробника, доки клієнт не пройшов кроки 2–8.
- Не перемикати DNS, доки preview хостингу клієнта не відкривається.
- Не revoke Telegram-токена, доки новий токен не в env і тестова заявка не прийшла.
- Не видаляти старі env на старому хості, доки новий прогін заявки і CMS не підтверджені.
- Не `--replace` import у production «для перевірки».

---

## Що не чіпати в цій фазі

Не мігрувати production Sanity, не деплоїти, не transfer акаунтів, не крутити секрети, не запрошувати клієнта, не міняти DNS.
