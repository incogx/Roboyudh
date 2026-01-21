import React from 'react';
import { Trophy, Zap, Users, FileText, Shield } from 'lucide-react';

const RoboSumoDetails = () => (
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
          <img src="/images/robo_sumo.png" alt="Robo Sumo" className="h-48 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" /> RoboSumo
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Battle bots in a sumo ring. Push your opponent out to win!
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 font-semibold rounded-lg border border-cyan-400/30 flex items-center gap-2 hover:bg-cyan-500/40 transition">
              <Users className="w-5 h-5" /> Max 5 per team
            </span>
            <a href="/rulebooks/Robo_Sumo_Rulebook.pdf" download className="px-4 py-2 bg-purple-500/20 text-purple-300 font-semibold rounded-lg border border-purple-400/30 flex items-center gap-2 hover:bg-purple-500/40 transition">
              <FileText className="w-5 h-5" /> Rulebook PDF
            </a>
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 font-semibold rounded-lg border border-yellow-400/30 flex items-center gap-2 hover:bg-yellow-500/40 transition">
              <Trophy className="w-5 h-5" /> Knockout Tournament
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
              <p>RoboSumo is an exciting robotics combat event where two robots compete inside a circular arena to push the opponent out of the ring. The event tests robot design, control strategy, power, and maneuverability, with victories achieved through effective pushing and tactical movements.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">2. Robot Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Heavyweight: Maximum 5 kg</li>
                <li>Robot must fit within 30 cm × 30 cm × 30 cm at the start of the match</li>
                <li>Battery-operated only</li>
                <li>Batteries must be securely mounted on the robot</li>
                <li>Maximum allowable voltage: 24V</li>
                <li>Combustion engines are strictly prohibited</li>
                <li>Robots must be remotely controlled</li>
                <li>Wireless communication must comply with event standards</li>
                <li>Destructive weapons are not allowed</li>
                <li>Pushing mechanisms are NOT allowed</li>
                <li>Scoops are permitted</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">3. Arena Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Arena shape: Circular (Dohyo)</li>
                <li>Arena material: Plywood</li>
                <li>Diameter: 180 cm</li>
                <li>White boundary line marks the edge of the arena</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">4. Event Structure</h3>
              <ul className="list-disc list-inside ml-4">
                <li>The competition follows a knockout tournament format</li>
                <li>Each match consists of 5 rounds</li>
                <li>Each round lasts 1 minute</li>
                <li>The winner is decided by best of 5 rounds</li>
                <li>Technical Superiority Rule: A team wins the round immediately if it achieves 5 push-outs in a single round</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">5. Rules & Regulations</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robots are placed inside the arena and activated after a countdown</li>
                <li>Allowed actions include: Pushing, Lifting, Flipping, Defensive maneuvers</li>
                <li>Prohibited actions include: Intentional damage to opponent robots, Use of liquids, fire, explosives, or external power sources</li>
                <li>Maximum 5 team members per team</li>
                <li>Pre-match verification of weight, size, and safety is mandatory</li>
                <li>Rules may be modified by the Head Coordinator if required</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">6. Marking Scheme / Scoring</h3>
              <ul className="list-disc list-inside ml-4">
                <li>1 point is awarded for pushing the opponent out of the arena</li>
                <li>Winner of each round is decided by total points</li>
                <li>Tournament type: Knockout</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">7. Safety Guidelines</h3>
              <ul className="list-disc list-inside ml-4">
                <li>A power cutoff switch is mandatory on all robots</li>
                <li>Only authorized personnel are allowed inside the arena</li>
                <li>No physical contact with robots during matches</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">8. Penalties</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Minor Penalties (Warnings): Deliberate stalling, Exceeding time limits</li>
                <li>Major Penalties (Disqualification): Intentional destruction of opponent robot, Safety violations, Use of prohibited weapons, Interfering with other teams, Failure to follow event timelines</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">9. Appeals & Disputes</h3>
              <ul className="list-disc list-inside ml-4">
                <li>All disputes will be handled by referees and event judges</li>
                <li>Their decision is final and binding</li>
              </ul>
            </section>
            <p className="text-xs text-gray-400 mt-6">
              📌 Rules adapted from the official Roboyudh’26 RoboSumo Rulebook
            </p>
          </div>
        </div>
        {/* Download Button */}
        <div className="flex justify-center mt-8">
          <a href="/rulebooks/Robo_Sumo_Rulebook.pdf" download className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg flex items-center gap-2">
            <FileText className="w-6 h-6" /> Download Rulebook PDF
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default RoboSumoDetails;
