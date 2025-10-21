import deepmerge from "deepmerge";
import { getRequestConfig, RequestConfig } from "next-intl/server";
import { getUserLocale } from "../services/locale";
import siteConfig from "../../richtpl.config";

type Messages = Record<string, any>;

export default getRequestConfig(async (): Promise<RequestConfig> => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getUserLocale();

  const userMessages = (await import(`../../.translations/${locale}.json`))
    .default as Messages;
  const defaultMessages = (
    await import(`../../.translations/${siteConfig.i18n.defaultLocale}.json`)
  ).default as Messages;
  const messages = deepmerge(defaultMessages, userMessages);

  return {
    locale,
    messages,
  };
});
