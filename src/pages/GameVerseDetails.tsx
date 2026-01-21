import React from 'react';

const GameVerseDetails = () => (
  <div className="max-w-3xl mx-auto p-8">
    <h1 className="text-4xl font-bold mb-4 text-orange-400">Game Verse</h1>
    <img src="/images/Game_verse.png" alt="Game Verse" className="w-full h-64 object-contain mb-6" />
    <p className="text-gray-300 mb-6">Compete in multiple gaming categories for the ultimate gaming championship. Only 2 members per team.</p>
    <h2 className="text-2xl font-semibold mb-2 text-orange-300">Rules</h2>
    <ul className="list-disc list-inside text-gray-200 mb-6">
      <li>Exactly 2 members per team</li>
      <li>Games will be announced on the day</li>
      <li>No cheating or unfair play</li>
      <li>Respect other participants</li>
      <li>Judge's decision is final</li>
    </ul>
    <a href="/rulebooks/GameVerse_Rulebook.pdf" download className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg">Download Rulebook PDF</a>
  </div>
);

export default GameVerseDetails;
