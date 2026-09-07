export function App() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
        <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Riff</h1>
      <p className="text-neutral-400 text-sm max-w-sm mb-6">
        Frontend reset complete. Ready to build from scratch one page at a time.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Backend Live & Connected
      </div>
    </main>
  );
}

export default App;
