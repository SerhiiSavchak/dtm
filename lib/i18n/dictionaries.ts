export type Locale = "uk" | "en";

export const defaultLocale: Locale = "uk";

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  brand: {
    name: string;
    descriptor: string;
  };
  nav: {
    services: string;
    projects: string;
    process: string;
    about: string;
    contact: string;
    estimate: string;
    estimateCta: string;
    mainAria: string;
    mobileAria: string;
    openMenu: string;
    closeMenu: string;
    homeAria: string;
  };
  hero: {
    meta: string;
    metaRight: string;
    line1: string;
    line2: string;
    line3: string;
    copy: string;
    ctaPrimary: string;
    ctaSecondary: string;
    imageAlt: string;
  };
  intro: {
    label: string;
    labelRight: string;
    headingBefore: string;
    headingAccent: string;
    headingAfter: string;
    body: string;
    proposition: string;
    responsibilities: { title: string; text: string }[];
  };
  projects: {
    label: string;
    heading: string;
    all: string;
    areaPlaceholder: string;
    titlePlaceholder: string;
    counter: string;
    close: string;
    next: string;
    prev: string;
    open: string;
    swipeHint: string;
    location: {
      lviv: string;
    };
    categories: {
      apartment: string;
      house: string;
      commercial: string;
    };
  };
  services: {
    label: string;
    labelRight: string;
    heading: string;
    items: {
      index: string;
      title: string;
      description: string;
    }[];
  };
  process: {
    label: string;
    labelRight: string;
    headingBefore: string;
    headingAccent: string;
    body: string;
    stages: { index: string; title: string; text: string }[];
  };
  inProgress: {
    label: string;
    labelRight: string;
    heading: string;
    body: string;
    stages: {
      finishing: string;
      install: string;
      detail: string;
      handover: string;
    };
    captionPlaceholder: string;
    instagramCta: string;
  };
  faq: {
    label: string;
    heading: string;
    items: { q: string; a: string }[];
  };
  estimate: {
    label: string;
    labelRight: string;
    headingBefore: string;
    headingAccent: string;
    body: string;
    contactLink: string;
  };
  finalCta: {
    headingBefore: string;
    headingAfter: string;
    body: string;
    primary: string;
    telegram: string;
    call: string;
  };
  calculator: {
    progress: string;
    back: string;
    next: string;
    submit: string;
    stepOf: string;
    steps: {
      objectType: {
        title: string;
        options: { value: string; label: string }[];
      };
      area: {
        title: string;
        hint: string;
        unit: string;
        placeholder: string;
      };
      rooms: {
        title: string;
        hint: string;
        skip: string;
      };
      renovationType: {
        title: string;
        options: { value: string; label: string }[];
      };
      design: {
        title: string;
        options: { value: string; label: string }[];
      };
      condition: {
        title: string;
        options: { value: string; label: string }[];
      };
      start: {
        title: string;
        options: { value: string; label: string }[];
      };
      lead: {
        title: string;
        name: string;
        namePlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        telegram: string;
        telegramPlaceholder: string;
        telegramOptional: string;
        disclaimer: string;
      };
    };
    success: {
      title: string;
      body: string;
      telegram: string;
      call: string;
      again: string;
    };
    errors: {
      required: string;
      area: string;
      phone: string;
      name: string;
      submit: string;
    };
    context: {
      object: string;
      area: string;
    };
  };
  footer: {
    tagline: string;
    locationLabel: string;
    location: string;
    socialLabel: string;
    copyright: string;
    localeMark: string;
  };
  theme: {
    toLight: string;
    toDark: string;
  };
  lang: {
    switchTo: string;
  };
};

const uk: Dictionary = {
  meta: {
    title: "DTM — Дім Твоєї Мрії · Комплексний ремонт у Львові",
    description:
      "DTM — комплексний ремонт квартир, будинків і комерційних просторів у Львові під ключ. Кошторис, організація робіт, прораб, комплектація та контроль виконання.",
  },
  brand: {
    name: "DTM",
    descriptor: "Дім твоєї мрії",
  },
  nav: {
    services: "Послуги",
    projects: "Наші роботи",
    process: "Як працюємо",
    about: "Про нас",
    contact: "Контакти",
    estimate: "Розрахувати",
    estimateCta: "Розрахувати вартість",
    mainAria: "Головна навігація",
    mobileAria: "Мобільна навігація",
    openMenu: "Відкрити меню",
    closeMenu: "Закрити меню",
    homeAria: "DTM — на початок",
  },
  hero: {
    meta: "Комплексний ремонт · Львів",
    metaRight: "DTM / 01",
    line1: "Комплексний",
    line2: "ремонт",
    line3: "під ключ",
    copy: "Квартири, будинки й комерційні простори у Львові — від першого кошторису до готового простору",
    ctaPrimary: "Отримати попередній розрахунок",
    ctaSecondary: "Дивитися роботи",
    imageAlt: "Інтер’єр після комплексного ремонту DTM у Львові",
  },
  intro: {
    label: "Відповідальність",
    labelRight: "Модель роботи",
    headingBefore: "Одна команда",
    headingAccent: "відповідає за весь процес",
    headingAfter: "",
    body: "DTM веде ремонт як єдиний процес — вам не потрібно координувати окремих підрядників. Ви узгоджуєте результат, а ми беремо на себе організацію всього процесу",
    proposition: "Що DTM бере на себе",
    responsibilities: [
      {
        title: "Кошторис і планування",
        text: "Зрозуміла структура робіт та етапів перед стартом",
      },
      {
        title: "Організація робіт і прораб",
        text: "Команда, графік і керування процесом на об’єкті",
      },
      {
        title: "Закупівля та комплектація",
        text: "Матеріали та комплектація під узгоджений результат",
      },
      {
        title: "Контроль виконання",
        text: "Перевірка якості та фото- й відеозвітність із об’єкта",
      },
    ],
  },
  projects: {
    label: "Портфоліо",
    heading: "Вибрані роботи",
    all: "Листати проєкти",
    areaPlaceholder: "[площа]",
    titlePlaceholder: "[Назва проєкту]",
    counter: "з",
    close: "Закрити",
    next: "Наступний",
    prev: "Попередній",
    open: "Відкрити проєкт",
    swipeHint: "Гортайте →",
    location: { lviv: "Львів" },
    categories: {
      apartment: "Квартира",
      house: "Будинок",
      commercial: "Комерція",
    },
  },
  services: {
    label: "Послуги",
    labelRight: "Напрями DTM",
    heading: "Напрями, у яких працюємо",
    items: [
      {
        index: "01",
        title: "Ремонт квартир під ключ",
        description:
          "Повний цикл — від демонтажу та чорнових робіт до фінішного оздоблення й меблювання",
      },
      {
        index: "02",
        title: "Ремонт будинків",
        description:
          "Комплексні роботи в приватних будинках з урахуванням інженерії та планування",
      },
      {
        index: "03",
        title: "Комерційні приміщення",
        description:
          "Офіси, заклади та торгові простори — ремонт з дотриманням термінів і бюджету",
      },
      {
        index: "04",
        title: "Дизайн інтер’єру",
        description:
          "Проєктування простору, підбір матеріалів та авторський нагляд на всіх етапах",
      },
    ],
  },
  process: {
    label: "Процес",
    labelRight: "Від запиту до передачі",
    headingBefore: "Як ми",
    headingAccent: "ведемо ремонт",
    body: "Чітка послідовність етапів — щоб ви завжди розуміли, що відбувається з об’єктом",
    stages: [
      {
        index: "01",
        title: "Знайомство та консультація",
        text: "Обговорюємо задачу, очікування й рамки проєкту",
      },
      {
        index: "02",
        title: "Оцінка об’єкта",
        text: "Оглядаємо простір і фіксуємо вихідні умови для розрахунку",
      },
      {
        index: "03",
        title: "Кошторис і планування",
        text: "Формуємо попередній розрахунок і план робіт",
      },
      {
        index: "04",
        title: "Організація робіт",
        text: "Збираємо команду, матеріали та графік виконання",
      },
      {
        index: "05",
        title: "Реалізація та контроль",
        text: "Ведемо роботи з контролем якості на кожному етапі",
      },
      {
        index: "06",
        title: "Передача готового об’єкта",
        text: "Завершуємо фінішні роботи й передаємо простір у користування",
      },
    ],
  },
  inProgress: {
    label: "У роботі",
    labelRight: "Поточні об’єкти",
    heading: "Об’єкти зараз у роботі",
    body: "Реальні кадри з поточних ремонтів DTM — хід робіт і звітність без інсценування",
    stages: {
      finishing: "Фінішні роботи",
      install: "Монтаж",
      detail: "Деталі",
      handover: "Підготовка до здачі",
    },
    captionPlaceholder: "[Об’єкт]",
    instagramCta: "Більше з процесу в Instagram",
  },
  faq: {
    label: "FAQ",
    heading: "Часті запитання",
    items: [
      {
        q: "Як формується попередній розрахунок?",
        a: "Ми збираємо параметри об’єкта — тип, площу, стан і обсяг робіт — і готуємо орієнтовний розрахунок. Точна вартість уточнюється після деталізації",
      },
      {
        q: "Чи можна замовити ремонт без дизайн-проєкту?",
        a: "Так. Можна починати без готового проєкту або проконсультуватися, чи він потрібен для вашого об’єкта",
      },
      {
        q: "Чи працюєте ви з новобудовами?",
        a: "Так, працюємо з новобудовами, вторинним житлом і об’єктами після демонтажу",
      },
      {
        q: "Чи можна замовити тільки окремі роботи?",
        a: "Основний напрям — комплексний ремонт. Окремі роботи узгоджуємо індивідуально, залежно від обсягу й етапу",
      },
      {
        q: "Як відбувається контроль ремонту?",
        a: "Контроль веде відповідальний від DTM: організація робіт, прораб на об’єкті та регулярна фото- й відеозвітність",
      },
      {
        q: "Коли краще звертатися перед початком ремонту?",
        a: "Що раніше — то краще: так можна спокійніше спланувати кошторис, комплектацію й старт робіт",
      },
    ],
  },
  estimate: {
    label: "Розрахунок",
    labelRight: "Без зобов’язань",
    headingBefore: "Почнемо з",
    headingAccent: "параметрів вашого об’єкта",
    body: "Кілька коротких питань про тип, площу й стан. Після цього ви отримаєте попередній розрахунок і наступні кроки",
    contactLink: "або звʼязатися напряму",
  },
  finalCta: {
    headingBefore: "Плануєте ремонт?",
    headingAfter: "Почнемо з попереднього розрахунку",
    body: "Коротко опишіть задачу — і ми повернемося з наступними кроками",
    primary: "Отримати попередній розрахунок",
    telegram: "Telegram",
    call: "Зателефонувати",
  },
  calculator: {
    progress: "Прогрес",
    back: "Назад",
    next: "Далі",
    submit: "Отримати попередній розрахунок",
    stepOf: "Крок",
    steps: {
      objectType: {
        title: "Який об’єкт плануєте ремонтувати?",
        options: [
          { value: "apartment", label: "Квартира" },
          { value: "house", label: "Будинок" },
          { value: "commercial", label: "Комерційне приміщення" },
        ],
      },
      area: {
        title: "Яка орієнтовна площа?",
        hint: "Вкажіть орієнтовну площу в квадратних метрах",
        unit: "м²",
        placeholder: "напр. 72",
      },
      rooms: {
        title: "Скільки кімнат?",
        hint: "Актуально для квартир і будинків. Можна пропустити",
        skip: "Пропустити",
      },
      renovationType: {
        title: "Який тип ремонту розглядаєте?",
        options: [
          { value: "cosmetic", label: "Косметичний" },
          { value: "capital", label: "Капітальний" },
          { value: "turnkey", label: "Під ключ" },
        ],
      },
      design: {
        title: "Чи є дизайн-проєкт?",
        options: [
          { value: "yes", label: "Є" },
          { value: "no", label: "Немає" },
          { value: "consult", label: "Потрібна консультація" },
        ],
      },
      condition: {
        title: "Який поточний стан об’єкта?",
        options: [
          { value: "newbuild", label: "Новобудова" },
          { value: "secondary", label: "Вторинне житло" },
          { value: "demolished", label: "Після демонтажу" },
          { value: "other", label: "Інше" },
        ],
      },
      start: {
        title: "Коли плануєте старт робіт?",
        options: [
          { value: "asap", label: "Якнайшвидше" },
          { value: "1-3", label: "1–3 місяці" },
          { value: "3-6", label: "3–6 місяців" },
          { value: "later", label: "Пізніше" },
        ],
      },
      lead: {
        title: "Куди надіслати попередній розрахунок?",
        name: "Ім’я",
        namePlaceholder: "Ваше ім’я",
        phone: "Телефон",
        phonePlaceholder: "+380 …",
        telegram: "Telegram",
        telegramPlaceholder: "@username",
        telegramOptional: "необов’язково",
        disclaimer:
          "Ми не обіцяємо точну автоматичну вартість. Після запиту менеджер DTM зв’яжеться з вами й передасть орієнтовний розрахунок",
      },
    },
    success: {
      title: "Запит отримано",
      body: "DTM отримав вашу заявку. Ми зв’яжемося з вами найближчим часом, щоб уточнити деталі та підготувати попередній розрахунок",
      telegram: "Написати в Telegram",
      call: "Зателефонувати",
      again: "Надіслати ще один запит",
    },
    errors: {
      required: "Оберіть варіант, щоб продовжити",
      area: "Вкажіть площу від 1 до 2000 м²",
      phone: "Вкажіть коректний номер телефону",
      name: "Вкажіть ім’я",
      submit: "Не вдалося надіслати запит. Спробуйте ще раз.",
    },
    context: {
      object: "Об’єкт",
      area: "Площа",
    },
  },
  footer: {
    tagline:
      "Комплексний ремонт квартир, будинків і комерційних просторів у Львові",
    locationLabel: "Локація",
    location: "Львів, Україна",
    socialLabel: "Соцмережі",
    copyright: "DTM — Дім Твоєї Мрії",
    localeMark: "Львів · Україна",
  },
  theme: {
    toLight: "Світла тема",
    toDark: "Темна тема",
  },
  lang: {
    switchTo: "EN",
  },
};

const en: Dictionary = {
  meta: {
    title: "DTM — Dim Tvoyeyi Mriyi · Full-cycle renovation in Lviv",
    description:
      "DTM delivers full-cycle renovation for apartments, houses and commercial spaces in Lviv — estimate, site management, procurement and quality control.",
  },
  brand: {
    name: "DTM",
    descriptor: "Dim tvoyeyi mriyi",
  },
  nav: {
    services: "Services",
    projects: "Projects",
    process: "How we work",
    about: "About us",
    contact: "Contact",
    estimate: "Get an estimate",
    estimateCta: "Estimate cost",
    mainAria: "Primary navigation",
    mobileAria: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "DTM — back to top",
  },
  hero: {
    meta: "Full-cycle renovation · Lviv",
    metaRight: "DTM / 01",
    line1: "Full-cycle",
    line2: "renovation",
    line3: "turnkey",
    copy: "Apartments, houses and commercial spaces in Lviv — from the first estimate to a finished interior",
    ctaPrimary: "Get a preliminary estimate",
    ctaSecondary: "View projects",
    imageAlt: "Interior after a DTM full-cycle renovation in Lviv",
  },
  intro: {
    label: "Responsibility",
    labelRight: "How we work",
    headingBefore: "One team",
    headingAccent: "owns the whole process",
    headingAfter: "",
    body: "DTM runs renovation as a single process — so you don’t coordinate separate contractors. You approve the result; we own the organisation",
    proposition: "What DTM takes on",
    responsibilities: [
      {
        title: "Estimate & planning",
        text: "A clear structure of works and stages before the start",
      },
      {
        title: "Work organisation & site manager",
        text: "Team, schedule and on-site process management",
      },
      {
        title: "Procurement & fit-out",
        text: "Materials and fit-out aligned to the agreed result",
      },
      {
        title: "Execution control",
        text: "Quality checks and photo / video progress reporting",
      },
    ],
  },
  projects: {
    label: "Portfolio",
    heading: "Selected projects",
    all: "Browse projects",
    areaPlaceholder: "[area]",
    titlePlaceholder: "[Project title]",
    counter: "of",
    close: "Close",
    next: "Next",
    prev: "Previous",
    open: "Open project",
    swipeHint: "Swipe →",
    location: { lviv: "Lviv" },
    categories: {
      apartment: "Apartment",
      house: "House",
      commercial: "Commercial",
    },
  },
  services: {
    label: "Services",
    labelRight: "DTM directions",
    heading: "What we work on",
    items: [
      {
        index: "01",
        title: "Turnkey apartment renovation",
        description:
          "Full cycle — from demolition and rough works to finishing and furnishing",
      },
      {
        index: "02",
        title: "House renovation",
        description:
          "Comprehensive works in private homes, including engineering and planning",
      },
      {
        index: "03",
        title: "Commercial spaces",
        description:
          "Offices, venues and retail — renovation with schedule and budget discipline",
      },
      {
        index: "04",
        title: "Interior design",
        description:
          "Spatial design, material selection and author supervision at every stage",
      },
    ],
  },
  process: {
    label: "Process",
    labelRight: "From enquiry to handover",
    headingBefore: "How we",
    headingAccent: "run a renovation",
    body: "A clear sequence of stages — so you always know what is happening on site",
    stages: [
      {
        index: "01",
        title: "Introduction & consultation",
        text: "We discuss the brief, expectations and project frame",
      },
      {
        index: "02",
        title: "Site assessment",
        text: "We review the space and record starting conditions for the estimate",
      },
      {
        index: "03",
        title: "Estimate & planning",
        text: "We prepare a preliminary estimate and a work plan",
      },
      {
        index: "04",
        title: "Work organisation",
        text: "We assemble the team, materials and execution schedule",
      },
      {
        index: "05",
        title: "Delivery & control",
        text: "We execute with quality checks at every stage",
      },
      {
        index: "06",
        title: "Handover",
        text: "We finish the space and hand it over ready to use",
      },
    ],
  },
  inProgress: {
    label: "In progress",
    labelRight: "Live sites",
    heading: "Projects currently in progress",
    body: "Real frames from active DTM renovations — process, reporting and progress without staging",
    stages: {
      finishing: "Finishing works",
      install: "Installation",
      detail: "Details",
      handover: "Pre-handover",
    },
    captionPlaceholder: "[Project]",
    instagramCta: "More process on Instagram",
  },
  faq: {
    label: "FAQ",
    heading: "Frequently asked questions",
    items: [
      {
        q: "How is the preliminary estimate formed?",
        a: "We collect property parameters — type, area, condition and scope — and prepare an indicative estimate. Exact cost is refined after detailing",
      },
      {
        q: "Can I order a renovation without a design project?",
        a: "Yes. You can start without a finished design, or get advice on whether you need one for your property",
      },
      {
        q: "Do you work with new builds?",
        a: "Yes — new builds, secondary housing and sites after demolition",
      },
      {
        q: "Can I order only selected works?",
        a: "Our focus is full-cycle renovation. Partial scopes are discussed case by case",
      },
      {
        q: "How is the renovation controlled?",
        a: "A DTM lead owns the process: work organisation, a site foreman, and regular photo / video reporting",
      },
      {
        q: "When should I get in touch before starting?",
        a: "The earlier the better — so estimate, procurement and start can be planned calmly",
      },
    ],
  },
  estimate: {
    label: "Estimate",
    labelRight: "No obligation",
    headingBefore: "Let’s start with",
    headingAccent: "your property parameters",
    body: "A few short questions about type, area and condition. DTM then follows up with an indicative preliminary estimate and next steps",
    contactLink: "or contact us directly",
  },
  finalCta: {
    headingBefore: "Planning a renovation?",
    headingAfter: "Start with a preliminary estimate",
    body: "Share a short brief — and we’ll come back with next steps",
    primary: "Get a preliminary estimate",
    telegram: "Telegram",
    call: "Call us",
  },
  calculator: {
    progress: "Progress",
    back: "Back",
    next: "Next",
    submit: "Get a preliminary estimate",
    stepOf: "Step",
    steps: {
      objectType: {
        title: "What type of property are you renovating?",
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "house", label: "House" },
          { value: "commercial", label: "Commercial space" },
        ],
      },
      area: {
        title: "Approximate area?",
        hint: "Enter an indicative area in square metres",
        unit: "m²",
        placeholder: "e.g. 72",
      },
      rooms: {
        title: "How many rooms?",
        hint: "Relevant for apartments and houses. You can skip this",
        skip: "Skip",
      },
      renovationType: {
        title: "What type of renovation are you considering?",
        options: [
          { value: "cosmetic", label: "Cosmetic" },
          { value: "capital", label: "Major renovation" },
          { value: "turnkey", label: "Turnkey" },
        ],
      },
      design: {
        title: "Do you have a design project?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "consult", label: "Need a consultation" },
        ],
      },
      condition: {
        title: "Current condition of the property?",
        options: [
          { value: "newbuild", label: "New build" },
          { value: "secondary", label: "Secondary housing" },
          { value: "demolished", label: "After demolition" },
          { value: "other", label: "Other" },
        ],
      },
      start: {
        title: "When do you plan to start?",
        options: [
          { value: "asap", label: "As soon as possible" },
          { value: "1-3", label: "1–3 months" },
          { value: "3-6", label: "3–6 months" },
          { value: "later", label: "Later" },
        ],
      },
      lead: {
        title: "Where should we send the preliminary estimate?",
        name: "Name",
        namePlaceholder: "Your name",
        phone: "Phone",
        phonePlaceholder: "+380 …",
        telegram: "Telegram",
        telegramPlaceholder: "@username",
        telegramOptional: "optional",
        disclaimer:
          "We do not promise an exact automatic price. After your request, a DTM manager will contact you with an indicative estimate",
      },
    },
    success: {
      title: "Request received",
      body: "DTM has received your request. We will contact you shortly to clarify details and prepare a preliminary estimate",
      telegram: "Message on Telegram",
      call: "Call us",
      again: "Submit another request",
    },
    errors: {
      required: "Choose an option to continue",
      area: "Enter an area between 1 and 2000 m²",
      phone: "Enter a valid phone number",
      name: "Enter your name",
      submit: "Could not send the request. Please try again.",
    },
    context: {
      object: "Property",
      area: "Area",
    },
  },
  footer: {
    tagline:
      "Full-cycle renovation of apartments, houses and commercial spaces in Lviv",
    locationLabel: "Location",
    location: "Lviv, Ukraine",
    socialLabel: "Social",
    copyright: "DTM — Dim Tvoyeyi Mriyi",
    localeMark: "Lviv · Ukraine",
  },
  theme: {
    toLight: "Light theme",
    toDark: "Dark theme",
  },
  lang: {
    switchTo: "UA",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { uk, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.uk;
}

export const navHrefs = {
  services: "#services",
  projects: "#projects",
  process: "#process",
  about: "#about",
  contact: "#contacts",
  estimate: "#estimate",
} as const;
