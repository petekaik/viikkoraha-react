import { useLanguageStore } from '../stores/languageStore';
import { translations } from '../i18n/translations';

export default function DashboardSummary({ pending, totalPaid }) {
  const lang = useLanguageStore((s) => s.language);
  const t = (path) => path.split('.').reduce((o, k) => o?.[k], translations[lang]);

  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-1 bg-gray-800 rounded-xl p-5">
        <p className="text-sm text-amber-400 font-medium mb-1">{t('ui.dashboard.pending')}</p>
        <p className="text-3xl font-bold text-white">{pending.toFixed(2)}€</p>
      </div>
      <div className="flex-1 bg-gray-800 rounded-xl p-5">
        <p className="text-sm text-green-400 font-medium mb-1">{t('ui.dashboard.earned')}</p>
        <p className="text-3xl font-bold text-white">{totalPaid.toFixed(2)}€</p>
      </div>
    </div>
  );
}
