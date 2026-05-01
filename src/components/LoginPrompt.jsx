export default function LoginPrompt({ onLogin, isLoading, error }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Viikkoraha</h1>
        <p className="text-gray-400 text-sm mb-8">
          Kotitöiden seurantaan ja viikkorahan hallintaan
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Ladataan...</p>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white
              hover:bg-blue-700 active:scale-[0.97] transition-all
              focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800
              min-h-[44px]"
          >
            Kirjaudu Googlella
          </button>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
