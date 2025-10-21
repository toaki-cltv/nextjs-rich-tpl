"use client";

import { useLocale, useTranslations } from "next-intl";
import { SelectItem } from "@/components/ui/shadcn/select";
import LocaleSwitcherSelect from "./LocaleSwitcherSelect";
import siteConfig from "../../../../richtpl.config";

export default function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect defaultValue={locale} label={t("label")}>
      {siteConfig.i18n.locales.map((cur) => (
        <SelectItem key={cur} value={cur}>
          {t("locale", { locale: cur })}
        </SelectItem>
      ))}
    </LocaleSwitcherSelect>
  );
}
