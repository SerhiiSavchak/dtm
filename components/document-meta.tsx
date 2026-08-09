"use client";

import { useEffect } from "react";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";

/** Keep document title/description aligned with the active locale. */
export function DocumentMeta() {
  const { locale } = useLocale();
  const { meta } = useDictionary();

  useEffect(() => {
    document.title = meta.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", meta.description);
    }
  }, [locale, meta.description, meta.title]);

  return null;
}
