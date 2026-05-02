import { useApp } from '../utils/AppContext';

/**
 * Onboarding card shown when user is signed in but no spreadsheet is selected.
 * Guides user through: Open Settings → Pick/Create Sheet → Start using.
 */
export default function OnboardingGuide() {
  const { openSettings } = useApp();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-8 text-center shadow-xl">
        <div className="text-4xl mb-4">🚀</div>
        <h2 className="text-xl font-bold text-white mb-2">Tervetuloa Viikkorahaan!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Aloitetaan valitsemalla laskentataulukko johon kotityöt tallennetaan.
        </p>

        <ol className="text-left text-sm text-gray-300 space-y-3 mb-6">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-bold">1</span>
            <span>Avaa <strong>Asetukset</strong> oikean yläkulman hammasratas-kuvakkeesta</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-bold">2</span>
            <span>Valitse olemassa oleva taulukko tai luo uusi</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-bold">3</span>
            <span>Sovellus tarkistaa rakenteen automaattisesti — voit aloittaa kotitöiden kirjauksen!</span>
          </li>
        </ol>

        <button
          onClick={openSettings}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white
            hover:bg-blue-700 active:scale-[0.97] transition-all
            focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
        >
          ⚙️ Avaa asetukset
        </button>
      </div>
    </div>
  );
}
