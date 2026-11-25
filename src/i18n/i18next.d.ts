import 'i18next';
import type { resources } from './index';

// 번역 키 자동완성 + 오타 검사: t('dressUp.takePhoto') 처럼 쓰면 없는 키는 빨간 줄
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: (typeof resources)['ko'];
  }
}
