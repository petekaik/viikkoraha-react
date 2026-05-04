import { useCallback } from 'react';
import { useLanguageStore } from '../stores/languageStore';
import { translations } from './translations';

/**
 * useTranslation — lightweight i18n hook.
 * Returns:
 *   t(path)      — get translation string (dot-separated path, e.g. 'choreHeaders')
 *   language     — current language code
 *   setLanguage  — switch language
 *   getChore     — get translated chore by id
 *   getChores    — get all translated default chores
 */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const t = useCallback(
    (path, params) => {
      const keys = path.split('.');
      let val = translations[language];
      for (const k of keys) {
        if (val == null) return path;
        val = val[k];
      }
      if (val == null) return path;
      if (params) {
        let result = val;
        for (const [key, value] of Object.entries(params)) {
          result = result.replaceAll(`{${key}}`, value);
        }
        return result;
      }
      return val;
    },
    [language],
  );

  const getChore = useCallback(
    (id) => {
      const chore = translations[language]?.chores?.[id];
      if (!chore) return null;
      return { id, value: getBaseChoreValue(id), ...chore };
    },
    [language],
  );

  const getChores = useCallback(() => {
    const map = translations[language]?.chores || {};
    return Object.entries(map).map(([id, chore]) => ({
      id,
      value: getBaseChoreValue(id),
      ...chore,
    }));
  }, [language]);

  return { t, language, setLanguage, getChore, getChores };
}

/** Chore values are language-independent, stored here as single source of truth. */
const BASE_CHORE_VALUES = {
  siivous: 2,
  tiskaus: 1.5,
  ruoanlaitto: 2,
  pyykki: 1.5,
  roskat: 0.5,
  ruokaostokset: 1,
  posti: 0.5,
  vauva: 3,
};

function getBaseChoreValue(id) {
  return BASE_CHORE_VALUES[id] ?? 0;
}
