import React from 'react';
import { Trophy, Zap, Users, FileText, Shield } from 'lucide-react';

const RC_RacingDetails = () => (
  <div className="max-w-4xl mx-auto p-8 relative mt-24">
    {/* Background Glow */}
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
    </div>
    <div className="bg-gradient-to-br from-gray-900 via-black to-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="bg-gradient-to-br from-cyan-900/40 to-black/60 border border-cyan-400/30 rounded-2xl shadow-xl p-4 flex items-center justify-center w-full md:w-80 h-64">
          <img src="/images/robo_racing.png" alt="RC Racing" className="h-48 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" /> RC Racing
          </h1>
          <p className="text-lg text-gray-300 mb-4">Race your remote-controlled cars on a challenging track. Fastest team wins!</p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 font-semibold rounded-lg border border-cyan-400/30 flex items-center gap-2 hover:bg-cyan-500/40 transition">
              <Users className="w-5 h-5" /> Max 5 per team
            </span>
            <a href="/rulebooks/RC_Racing_Rulebook.pdf" download className="px-4 py-2 bg-purple-500/20 text-purple-300 font-semibold rounded-lg border border-purple-400/30 flex items-center gap-2 hover:bg-purple-500/40 transition">
              <FileText className="w-5 h-5" /> Rulebook PDF
            </a>
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 font-semibold rounded-lg border border-yellow-400/30 flex items-center gap-2 hover:bg-yellow-500/40 transition">
              <Trophy className="w-5 h-5" /> Multiple Rounds
            </span>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-yellow-400 rounded-full mb-10 opacity-60"></div>
      {/* Official Rules Card */}
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-cyan-900/40 to-black/60 border border-cyan-400/30 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
            <Shield className="w-7 h-7 text-cyan-400" /> Official Rules & Regulations
          </h2>
          <div className="text-gray-200 space-y-8">
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">1. Introduction</h3>
              <p>The RC Car Racing Championship is a high-energy competition that tests speed, precision, and control. Participants will compete in multiple racing formats such as Drag Racing, Time Attack, and Autocross, culminating in a final Head-on Battle.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">2. Robot (Vehicle) Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Only electric RC cars are allowed</li>
                <li>Vehicles must be operated using a wireless remote-control system</li>
                <li>No weapons or destructive mechanisms are permitted</li>
                <li>Any battery type is allowed</li>
                <li>IC engines or non-electric drive systems are strictly prohibited</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">3. Arena Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Drag Racing: Straight-line track with marked lanes</li>
                <li>Time Attack: Circuit track with curves and straight sections</li>
                <li>Autocross: Technical track focused on precision and control</li>
                <li>Minimum track width: ~50 cm</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">4. Ticket Requirement</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Each participant must purchase a Roboyudh’26 event ticket to be eligible to compete</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">5. Rounds & Event Format</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Drag Racing – Straight-line race testing top speed</li>
                <li>Time Attack – Fastest lap completion challenge</li>
                <li>Autocross – Precision and maneuvering test</li>
                <li>Head-on Battle – 1 vs 1 knockout racing</li>
                <li>➡️ Top teams are selected based on cumulative scores from the first three rounds</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">6. Rules & Regulations</h3>
              <ul className="list-disc list-inside ml-4">
                <li>This is a non-contact sport</li>
                <li>Intentional collisions are strictly prohibited</li>
                <li>Drivers must follow track marshals and officials’ instructions</li>
                <li>Leaving the track boundaries will result in penalties</li>
                <li>Drivers must remain in the designated driver stand</li>
                <li>Rules may be modified by the Head Coordinator if required</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">7. Marking Scheme / Scoring</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Drag Racing: Points based on best finish time</li>
                <li>Time Attack: Points based on fastest lap and ranking</li>
                <li>Autocross: Points awarded for best time per round</li>
                <li>Head-on Battle: Points awarded for each win</li>
                <li>Bonus Points: For best design or innovative modifications</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">8. Penalties</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Track boundary violation: Point deduction</li>
                <li>Intentional contact: Time/point penalty</li>
                <li>Repeated violations: Disqualification</li>
                <li>Unsportsmanlike behavior: Point deduction or removal from event</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">9. Disqualification Criteria</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Using vehicles that do not meet specifications</li>
                <li>Violating safety rules</li>
                <li>Repeated intentional contact or aggressive driving</li>
                <li>Unsportsmanlike conduct</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">10. Safety Guidelines</h3>
              <ul className="list-disc list-inside ml-4">
                <li>All vehicles must pass pre-race inspection</li>
                <li>Batteries must be securely mounted</li>
                <li>Charging is allowed only in designated areas</li>
                <li>Spectators must remain in designated viewing zones</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">11. Appeals & Disputes</h3>
              <ul className="list-disc list-inside ml-4">
                <li>All decisions made by the Event Committee are final</li>
                <li>No appeals will be entertained after results declaration</li>
              </ul>
            </section>
            <p className="text-xs text-gray-400 mt-6">📌 Rules adapted from the official Roboyudh’26 RC Racing Rulebook</p>
          </div>
        </div>
        {/* Download Button */}
        <div className="flex justify-center mt-8">
          <a href="/rulebooks/RC_Racing_Rulebook.pdf" download className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg flex items-center gap-2">
            <FileText className="w-6 h-6" /> Download Rulebook PDF
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default RC_RacingDetails;
