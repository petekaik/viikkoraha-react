import { useAuthStore } from '../stores/authStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import LoginPrompt from '../components/LoginPrompt';
import SettingsPanel from '../components/SettingsPanel';

export default function SettingsView() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const { login, logout, isLoading, error } = useGoogleAuth();

  if (!isSignedIn) {
    return <LoginPrompt onLogin={login} isLoading={isLoading} error={error} />;
  }

  return (
    <div className="p-4">
      <div className="mb-6 p-4 bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          {user?.imageUrl && (
            <img src={user.imageUrl} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <SettingsPanel />

      <button
        onClick={logout}
        className="w-full mt-6 py-3 bg-red-700/50 hover:bg-red-700 text-red-300 border border-red-700/30 rounded-xl font-medium transition-colors"
      >
        Kirjaudu ulos
      </button>
    </div>
  );
}
