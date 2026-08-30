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
    descriptionPlaceholder: string;
    counter: string;
    close: string;
    next: string;
    prev: string;
    open: string;
    look: string;
    swipeHint: string;
    discussCta: string;
    frame: string;
    videoKind: string;
    location: {
      lviv: string;
    };
    categories: {
      apartment: string;
      house: string;
      commercial: string;
    };
    objectTypes: {
      new_build: string;
      secondary: string;
      private_house: string;
      commercial: string;
    };
    facts: {
      objectType: string;
      location: string;
      type: string;
      rooms: string;
      area: string;
      workType: string;
      duration: string;
      year: string;
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
    mediaAlt: string;
    instagramCta: string;
    showMore: string;
    showLess: string;
    look: string;
    open: string;
    close: string;
    prev: string;
    next: string;
    gallery: string;
    photoKind: string;
    videoKind: string;
    play: string;
    pause: string;
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
    label: string;
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
        phoneHint: string;
        telegram: string;
        telegramPlaceholder: string;
        telegramOptional: string;
        disclaimer: string;
      };
    };
    success: {
      title: string;
      body: string;
      leadId: string;
      telegram: string;
      call: string;
      again: string;
    };
    sending: string;
    retry: string;
    errors: {
      required: string;
      areaEmpty: string;
      areaZero: string;
      areaDigits: string;
      phoneEmpty: string;
      phoneInvalid: string;
      name: string;
      submit: string;
    };
    context: {
      objectType: string;
      area: string;
      rooms: string;
      renovationType: string;
      design: string;
      condition: string;
      start: string;
    };
  };
  footer: {
    tagline: string;
    locationLabel: string;
    location: string;
    socialLabel: string;
    instagram: string;
    telegram: string;
    instagramAria: string;
    telegramAria: string;
    copyright: string;
    localeMark: string;
  };
  theme: {
    toLight: string;
    toDark: string;
  };
  lang: {
    switchTo: string;
    toEn: string;
    toUk: string;
    groupAria: string;
  };
};

const uk: Dictionary = {
  meta: {
    title: "DTM — Дім Твоєї Мрії · Комплексний ремонт у Львові",
    description:
      "DTM — комплексний ремонт квартир, будинків і комерційних приміщень у Львові під ключ. Кошторис, організація робіт, виконроб, комплектація та контроль виконання",
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
    estimateCta: "Попередній розрахунок",
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
    copy: "Квартири, будинки й комерційні приміщення у Львові — від першого кошторису до готового простору",
    ctaPrimary: "Отримати попередній розрахунок",
    ctaSecondary: "Дивитися роботи",
    imageAlt: "Атмосферне відео сучасного житлового інтер’єру — не об’єкт DTM",
  },
  intro: {
    label: "Відповідальність",
    labelRight: "Модель роботи",
    headingBefore: "Одна команда",
    headingAccent: "відповідає за весь процес",
    headingAfter: "",
    body: "Вам не потрібно координувати окремих підрядників. Ми беремо на себе організацію всього процесу, а ви узгоджуєте результат",
    proposition: "Що DTM бере на себе",
    responsibilities: [
      {
        title: "Кошторис і планування",
        text: "Зрозуміла структура робіт і етапів перед стартом",
      },
      {
        title: "Організація робіт і виконроб",
        text: "Команда, графік і ведення процесу на об’єкті",
      },
      {
        title: "Закупівля та комплектація",
        text: "Матеріали й комплектація під узгоджений результат",
      },
      {
        title: "Контроль виконання",
        text: "Перевірка якості, фото- та відеозвітність із об’єкта",
      },
    ],
  },
  projects: {
    label: "Портфоліо",
    heading: "Вибрані роботи",
    all: "Переглянути проєкти",
    areaPlaceholder: "[площа]",
    titlePlaceholder: "[Назва проєкту]",
    descriptionPlaceholder: "[Опис проєкту]",
    counter: "з",
    close: "Закрити",
    next: "Наступний",
    prev: "Попередній",
    open: "Відкрити проєкт",
    look: "Дивитися",
    swipeHint: "Гортайте →",
    discussCta: "Обговорити схожий проєкт",
    frame: "Кадр",
    videoKind: "Відео",
    location: { lviv: "Львів" },
    categories: {
      apartment: "Квартира",
      house: "Будинок",
      commercial: "Комерційне приміщення",
    },
    objectTypes: {
      new_build: "Новобудова",
      secondary: "Вторинне житло",
      private_house: "Приватний будинок",
      commercial: "Комерційне приміщення",
    },
    facts: {
      objectType: "Тип об'єкта",
      location: "Локація",
      type: "Тип",
      rooms: "Кімнати",
      area: "Площа",
      workType: "Тип робіт",
      duration: "Тривалість",
      year: "Рік",
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
          "Повний цикл — від демонтажу та чорнових робіт до фінішного оздоблення",
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
          "Офіси, заклади та торгові простори — ремонт з узгодженими термінами й бюджетом",
      },
      {
        index: "04",
        title: "Проєкт, виготовлення та монтаж меблів",
        description: "Проєкт меблів, виготовлення та монтаж",
      },
      {
        index: "05",
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
        text: "Плануємо етапи й матеріали для виконання, збираємо команду та графік",
      },
      {
        index: "05",
        title: "Реалізація та контроль",
        text: "Ведемо роботи з контролем якості на кожному етапі",
      },
      {
        index: "06",
        title: "Передача готового об’єкта",
        text: "Виконуємо післяремонтний клінінг, завершуємо фінішні роботи й передаємо простір у користування",
      },
    ],
  },
  inProgress: {
    label: "У роботі",
    labelRight: "Поточні об’єкти",
    heading: "Об’єкти зараз у роботі",
    body: "Живі кадри з майданчиків, де роботи ще тривають. Це не відретушована реклама.",
    mediaAlt: "Кадр з об’єкта DTM, де роботи ще тривають",
    instagramCta: "Більше з процесу в Instagram",
    showMore: "Показати більше",
    showLess: "Згорнути",
    look: "Дивитися",
    open: "Відкрити",
    close: "Закрити",
    prev: "Попередній",
    next: "Наступний",
    gallery: "Кадри з об’єктів у роботі",
    photoKind: "ФОТО",
    videoKind: "ВІДЕО",
    play: "Відтворити",
    pause: "Пауза",
  },
  faq: {
    label: "Запитання",
    heading: "Часті запитання",
    items: [
      {
        q: "Як формується попередній розрахунок?",
        a: "Ми збираємо параметри об’єкта — тип, площу, стан і обсяг робіт — і готуємо орієнтовний розрахунок. Точна вартість уточнюється після деталізації",
      },
      {
        q: "Чи можна замовити ремонт без дизайн-проєкту?",
        a: "Так. Можна починати без готового дизайн-проєкту або проговорити на консультації, чи він потрібен для вашого об’єкта",
      },
      {
        q: "Чи можна замовити тільки окремі роботи?",
        a: "Основний напрям — комплексний ремонт. Окремі роботи обговорюємо залежно від обсягу й етапу",
      },
      {
        q: "Як відбувається контроль ремонту?",
        a: "Контроль веде відповідальний від DTM: організація робіт, виконроб на об’єкті та регулярна фото- й відеозвітність",
      },
      {
        q: "Коли краще звертатися перед початком ремонту?",
        a: "Що раніше — то краще: так спокійніше спланувати кошторис, комплектацію й старт робіт",
      },
    ],
  },
  estimate: {
    label: "Розрахунок",
    labelRight: "Без зобов’язань",
    headingBefore: "Почнемо з",
    headingAccent: "параметрів вашого об’єкта",
    body: "Кілька коротких питань про тип, площу й стан. Після цього ви отримаєте попередній розрахунок і наступні кроки",
    contactLink: "Зв’язатися напряму",
  },
  finalCta: {
    label: "Контакти",
    headingBefore: "Плануєте ремонт?",
    headingAfter: "Почнемо з попереднього розрахунку",
    body: "Кілька коротких питань про об’єкт — далі підготуємо попередній розрахунок і наступні кроки",
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
        placeholder: "наприклад 72",
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
        phonePlaceholder: "+380 67 123 45 67",
        phoneHint: "Наприклад, +380 67 123 45 67",
        telegram: "Telegram",
        telegramPlaceholder: "@username",
        telegramOptional: "необов’язково",
        disclaimer:
          "Ми не обіцяємо точну автоматичну вартість. Після запиту менеджер DTM зв’яжеться з вами й передасть орієнтовний розрахунок",
      },
    },
    success: {
      title: "Дякуємо! Ми отримали вашу заявку.",
      body: "Незабаром зв’яжемося з вами, щоб уточнити деталі та підготувати попередній розрахунок.",
      leadId: "Номер заявки",
      telegram: "Відкрити Telegram",
      call: "Зателефонувати",
      again: "Розрахувати ще один об’єкт",
    },
    sending: "Надсилаємо заявку…",
    retry: "Спробувати ще раз",
    errors: {
      required: "Оберіть варіант, щоб продовжити",
      areaEmpty: "Вкажіть орієнтовну площу",
      areaZero: "Площа має бути більшою за 0",
      areaDigits: "Введіть площу цифрами",
      phoneEmpty: "Вкажіть номер телефону",
      phoneInvalid: "Перевірте номер телефону",
      name: "Вкажіть ім’я",
      submit: "Не вдалося надіслати запит. Дані збережено — спробуйте ще раз",
    },
    context: {
      objectType: "Об’єкт",
      area: "Площа",
      rooms: "Кімнати",
      renovationType: "Тип ремонту",
      design: "Дизайн-проєкт",
      condition: "Стан об’єкта",
      start: "Плановий старт",
    },
  },
  footer: {
    tagline:
      "Комплексний ремонт квартир, будинків і комерційних приміщень у Львові",
    locationLabel: "Локація",
    location: "Львів, Україна",
    socialLabel: "Соцмережі",
    instagram: "Instagram",
    telegram: "Telegram",
    instagramAria: "Instagram DTM",
    telegramAria: "Telegram DTM",
    copyright: "DTM — Дім Твоєї Мрії",
    localeMark: "Львів · Україна",
  },
  theme: {
    toLight: "Світла тема",
    toDark: "Темна тема",
  },
  lang: {
    switchTo: "EN",
    toEn: "Switch to English",
    toUk: "Перейти на українську",
    groupAria: "Мова",
  },
};

const en: Dictionary = {
  meta: {
    title: "DTM — Dim Tvoyeyi Mriyi · Full-cycle renovation in Lviv",
    description:
      "DTM delivers full-cycle renovation for apartments, houses and commercial spaces in Lviv — estimate, site management, procurement and quality control",
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
    estimateCta: "Preliminary estimate",
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
    imageAlt: "Atmospheric footage of a contemporary residential interior — not a DTM project",
  },
  intro: {
    label: "Responsibility",
    labelRight: "How we work",
    headingBefore: "One team",
    headingAccent: "owns the whole process",
    headingAfter: "",
    body: "You do not need to coordinate separate contractors. We take on organising the whole process, and you approve the result",
    proposition: "What DTM takes on",
    responsibilities: [
      {
        title: "Estimate & planning",
        text: "A clear structure of works and stages before the start",
      },
      {
        title: "Work organisation & site supervisor",
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
    descriptionPlaceholder: "[Project description]",
    counter: "of",
    close: "Close",
    next: "Next",
    prev: "Previous",
    open: "Open project",
    look: "View",
    swipeHint: "Swipe →",
    discussCta: "Discuss a similar project",
    frame: "Frame",
    videoKind: "Video",
    location: { lviv: "Lviv" },
    categories: {
      apartment: "Apartment",
      house: "House",
      commercial: "Commercial space",
    },
    objectTypes: {
      new_build: "New build",
      secondary: "Secondary housing",
      private_house: "Private house",
      commercial: "Commercial space",
    },
    facts: {
      objectType: "Property type",
      location: "Location",
      type: "Type",
      rooms: "Rooms",
      area: "Area",
      workType: "Scope",
      duration: "Duration",
      year: "Year",
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
          "Full cycle — from demolition and rough works to finishing",
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
          "Offices, venues and retail — renovation with agreed schedule and budget",
      },
      {
        index: "04",
        title: "Furniture design, production and installation",
        description: "Furniture project, production and installation",
      },
      {
        index: "05",
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
        text: "We plan stages and materials for delivery, assemble the team and schedule",
      },
      {
        index: "05",
        title: "Delivery & control",
        text: "We execute with quality checks at every stage",
      },
      {
        index: "06",
        title: "Handover",
        text: "We carry out post-renovation cleaning, complete finishing works and hand the space over ready to use",
      },
    ],
  },
  inProgress: {
    label: "In progress",
    labelRight: "Live sites",
    heading: "Projects currently in progress",
    body: "Live frames from sites where work is still underway. This is not retouched advertising.",
    mediaAlt: "Frame from a DTM site where work is still underway",
    instagramCta: "More process on Instagram",
    showMore: "Show more",
    showLess: "Show less",
    look: "View",
    open: "Open",
    close: "Close",
    prev: "Previous",
    next: "Next",
    gallery: "Frames from sites in progress",
    photoKind: "Photo",
    videoKind: "Video",
    play: "Play",
    pause: "Pause",
  },
  faq: {
    label: "Questions",
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
        q: "Can I order only selected works?",
        a: "Our focus is full-cycle renovation. Partial scopes are discussed case by case",
      },
      {
        q: "How is the renovation controlled?",
        a: "A DTM lead owns the process: work organisation, a site supervisor on site, and regular photo / video reporting",
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
    contactLink: "Contact us directly",
  },
  finalCta: {
    label: "Contact",
    headingBefore: "Planning a renovation?",
    headingAfter: "Start with a preliminary estimate",
    body: "A few short questions about the property — then we prepare a preliminary estimate and next steps",
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
        phonePlaceholder: "+380 67 123 45 67",
        phoneHint: "For example, +380 67 123 45 67",
        telegram: "Telegram",
        telegramPlaceholder: "@username",
        telegramOptional: "optional",
        disclaimer:
          "We do not promise an exact automatic price. After your request, a DTM manager will contact you with an indicative estimate",
      },
    },
    success: {
      title: "Thank you! We have received your request.",
      body: "We will contact you shortly to clarify the details and prepare a preliminary estimate.",
      leadId: "Request number",
      telegram: "Open Telegram",
      call: "Call us",
      again: "Estimate another property",
    },
    sending: "Sending your request…",
    retry: "Try again",
    errors: {
      required: "Choose an option to continue",
      areaEmpty: "Enter an approximate area",
      areaZero: "Area must be greater than 0",
      areaDigits: "Enter the area in numbers",
      phoneEmpty: "Enter a phone number",
      phoneInvalid: "Check the phone number",
      name: "Enter your name",
      submit: "Could not send the request. Your answers are saved — try again",
    },
    context: {
      objectType: "Property",
      area: "Area",
      rooms: "Rooms",
      renovationType: "Renovation type",
      design: "Design project",
      condition: "Condition",
      start: "Planned start",
    },
  },
  footer: {
    tagline:
      "Full-cycle renovation of apartments, houses and commercial spaces in Lviv",
    locationLabel: "Location",
    location: "Lviv, Ukraine",
    socialLabel: "Social",
    instagram: "Instagram",
    telegram: "Telegram",
    instagramAria: "Instagram DTM",
    telegramAria: "Telegram DTM",
    copyright: "DTM — Dim Tvoyeyi Mriyi",
    localeMark: "Lviv · Ukraine",
  },
  theme: {
    toLight: "Light theme",
    toDark: "Dark theme",
  },
  lang: {
    switchTo: "UA",
    toEn: "Switch to English",
    toUk: "Switch to Ukrainian",
    groupAria: "Language",
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
