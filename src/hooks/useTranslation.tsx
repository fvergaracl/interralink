import en from "../locales/en/common.json"
import it from "../locales/it/common.json"
import da from "../locales/da/common.json"
import nl from "../locales/nl/common.json"

const translations: { [key: string]: { [key: string]: string } } = {
  en,
  it,
  da,
  nl
}

export function useTranslation() {
  const locale = localStorage.getItem("locale")

  const currentLocale =
    locale && Object.keys(translations).includes(locale) ? locale : "en"

  const t = (key: string) => translations[currentLocale][key] || key
  const tLocale = (key: string, locale: string) =>
    translations[locale][key] || key

  const setLocale = (locale: string) => {
    localStorage.setItem("locale", locale)
  }

  return { t, tLocale, setLocale, locale: currentLocale }
}

export class TranslationBackend {
  private locale: string

  constructor(locale: string = "en") {
    this.locale = locale
  }

  t(key: string): string {
    return translations[this.locale][key] || key
  }

  tLocale(key: string, locale: string): string {
    return translations[locale][key] || key
  }
}
