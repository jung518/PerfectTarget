import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';

// 다국어(i18n) 설정
// - 문구는 src/i18n/locales/<언어>.json 에 있음 (새 언어 추가: json 파일 + 아래 resources·LANGUAGES에 등록)
// - 언어 결정 순서: 주소의 ?lang=en → 지난번에 고른 언어(localStorage) → 브라우저 언어 → 한국어

// 한국어(ko.json)가 기준: 다른 언어에 키가 빠져 있으면 `npm run build` 때 에러로 알려 줌
export const resources = {
  ko: { translation: ko },
  en: { translation: en satisfies typeof ko },
  ja: { translation: ja satisfies typeof ko },
} as const;
export const LANGUAGES = ['ko', 'en', 'ja'] as const;
export type Language = (typeof LANGUAGES)[number];

i18n.use(LanguageDetector).init({
  resources,
  fallbackLng: 'ko', // 번역이 없는 문구는 한국어로 보여 줌
  supportedLngs: LANGUAGES,
  nonExplicitSupportedLngs: true, // en-US → en, ja-JP → ja
  interpolation: { escapeValue: false }, // HTML이 아니라 캔버스에 그리므로 이스케이프 불필요
  detection: {
    order: ['querystring', 'localStorage', 'navigator'],
    lookupQuerystring: 'lang',
    lookupLocalStorage: 'lang',
    caches: ['localStorage'],
  },
});

// 현재 언어 (LANGUAGES 중 하나로 정리)
export function currentLanguage(): Language {
  const lng = i18n.resolvedLanguage;
  return LANGUAGES.includes(lng as Language) ? (lng as Language) : 'ko';
}

// <html lang="..."> 을 현재 언어로 맞춤 (스크린 리더·번역기·검색엔진용)
const syncHtmlLang = (lng: string) => document.documentElement.setAttribute('lang', lng);
syncHtmlLang(currentLanguage());
i18n.on('languageChanged', syncHtmlLang);

export const t = i18n.t.bind(i18n);
export default i18n;
