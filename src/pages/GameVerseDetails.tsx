

const GameVerseDetails = () => (
  <div className="max-w-4xl mx-auto p-8 relative mt-24">
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
    </div>

    <div className="bg-gradient-to-br from-gray-900 via-black to-slate-900 border border-orange-500/30 rounded-3xl shadow-2xl shadow-orange-500/20 p-8">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="bg-gradient-to-br from-orange-900/40 to-black/60 border border-orange-400/30 rounded-2xl shadow-xl p-4 flex items-center justify-center w-full md:w-80 h-64">
          <img src="/images/Game_verse.png" alt="Game Verse" className="h-48 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-orange-400 to-purple-500 text-transparent bg-clip-text">
            Game Verse
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Compete in multiple gaming categories for the ultimate gaming championship. Exactly 2 members per team.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="px-4 py-2 bg-orange-500/20 text-orange-300 font-semibold rounded-lg border border-orange-400/30">
              Exactly 2 members per team
            </span>
            <a
              href="/rulebooks/GAMEVERSE_RULESBOOK_FINAL.pdf"
              download
              className="px-4 py-2 bg-purple-500/20 text-purple-300 font-semibold rounded-lg border border-purple-400/30 hover:bg-purple-500/40 transition"
            >
              Rulebook PDF
            </a>
          </div>
        </div>
      </div>

      <div className="w-full h-1 bg-gradient-to-r from-orange-400 via-purple-500 to-yellow-400 rounded-full mb-10 opacity-60"></div>

      <div className="bg-gradient-to-br from-orange-900/40 to-black/60 border border-orange-400/30 rounded-2xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold text-orange-300 mb-6">Rules</h2>
        <ul className="list-disc list-inside text-gray-200 space-y-2">
          <li>Exactly 2 members per team</li>
          <li>Games will be announced on the day</li>
          <li>No cheating or unfair play</li>
          <li>Respect other participants</li>
          <li>Judge's decision is final</li>
        </ul>
      </div>

      <div className="flex justify-center mt-8">
        <a
          href="/rulebooks/GAMEVERSE_RULESBOOK_FINAL.pdf"
          download
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg"
        >
          Download Rulebook PDF
        </a>
      </div>
    </div>
  </div>
);

export default GameVerseDetails;
