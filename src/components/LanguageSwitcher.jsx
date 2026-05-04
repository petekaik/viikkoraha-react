import { useTranslation } from '../i18n/useTranslation';

const LANGUAGES = [
  { code: 'fi', label: '🇫🇮 Suomi', native: 'Suomi' },
  { code: 'se', label: '🇸🇪 Svenska', native: 'Svenska' },
  { code: 'en', label: '🇬🇧 English', native: 'English' },
];

export default function LanguageSwitcher() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">{t('ui.settings.language')}</p>
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              language === lang.code
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
