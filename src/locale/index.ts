import en from './lang/en-US';
import ja from './lang/ja';

const t = (text: string, locale: string): string => {
  return locale === 'ja' ? ja[text as keyof typeof ja] : en[text as keyof typeof en];
}

export default t;