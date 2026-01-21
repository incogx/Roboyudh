import React from 'react';
import { Trophy, Zap, Users, FileText, Shield } from 'lucide-react';

const ObstacleRunDetails = () => (
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
          <img src="/images/obstacle_run.png" alt="Obstacle Run" className="h-48 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" /> Obstacle Run
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Navigate your robot through a series of obstacles. Fastest time wins!
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 font-semibold rounded-lg border border-cyan-400/30 flex items-center gap-2 hover:bg-cyan-500/40 transition">
              <Users className="w-5 h-5" /> Max 5 per team
            </span>
            <a href="/rulebooks/Obstacle_Run_Rulebook.pdf" download className="px-4 py-2 bg-purple-500/20 text-purple-300 font-semibold rounded-lg border border-purple-400/30 flex items-center gap-2 hover:bg-purple-500/40 transition">
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
              <p>Obstacle Run is a fast-paced robotics challenge where teams manually control their robots through a predefined obstacle course. The objective is to complete the course in the shortest possible time. The event tests driving precision, control, and strategy, as obstacle skipping is allowed with time penalties.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">2. Robot Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robot must be manually controlled</li>
                <li>Wireless control only</li>
                <li>Maximum dimensions at start: 30 cm × 30 cm × 30 cm</li>
                <li>Maximum weight: 5 kg (±5% tolerance allowed)</li>
                <li>Battery operated only</li>
                <li>Maximum voltage: 24V</li>
                <li>Team size: 1–5 members</li>
                <li>One robot per team is allowed</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">3. Arena Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>The arena consists of multiple obstacles such as ramps, turns, speed breakers, tunnels, and checkpoints</li>
                <li>Obstacle types and layout are subject to change</li>
                <li>Final obstacle layout will be revealed on the event day</li>
                <li>Arena surface and obstacle dimensions will be uniform for all teams</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">4. Event Structure</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Each team is given one official run</li>
                <li>A second attempt may be allowed if time permits (organizers’ discretion)</li>
                <li>Final ranking is based on total completion time including penalties</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">5. Rules & Regulations</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robots must be manually controlled at all times</li>
                <li>External assistance during the run is strictly prohibited</li>
                <li>Obstacle skipping is allowed but will attract penalties</li>
                <li>Robots must follow the designated track and direction</li>
                <li>Any intentional damage to the arena or obstacles will lead to immediate disqualification</li>
                <li>Technical disputes will be resolved by the event organizers</li>
                <li>Rules may be modified by the Head Coordinator if required</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">6. Penalties</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Skipping an obstacle: Time penalty (announced before the event)</li>
                <li>Leaving the track: Time penalty or restart at referee’s discretion</li>
                <li>Human interference: Penalty or immediate disqualification</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">7. Disqualification</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robot exceeds size or weight limits</li>
                <li>Robot design or operation is deemed unsafe</li>
                <li>Repeated rule violations occur</li>
                <li>Unsportsmanlike conduct is observed</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">8. Safety Guidelines</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robots must not contain sharp edges or hazardous components</li>
                <li>All robots must pass pre-run safety inspection</li>
                <li>Participants must strictly follow referee and coordinator instructions</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">9. Appeals & Disputes</h3>
              <ul className="list-disc list-inside ml-4">
                <li>All decisions made by the referees and event coordinators are final</li>
                <li>No appeals will be accepted after result declaration</li>
              </ul>
            </section>
            <p className="text-xs text-gray-400 mt-6">
              📌 Rules adapted from the official Roboyudh’26 Obstacle Run Rulebook
            </p>
          </div>
        </div>
        {/* Download Button */}
        <div className="flex justify-center mt-8">
          <a href="/rulebooks/Obstacle_Run_Rulebook.pdf" download className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg flex items-center gap-2">
            <FileText className="w-6 h-6" /> Download Rulebook PDF
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default ObstacleRunDetails;
