import React from 'react';
import { Trophy, Zap, Users, FileText, Shield } from 'lucide-react';

const LineFollowerDetails = () => (
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
          <img src="/images/line_follower.png" alt="Line Follower" className="h-48 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" /> Line Follower
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Build and program a robot to follow a line path as quickly and accurately as possible.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 font-semibold rounded-lg border border-cyan-400/30 flex items-center gap-2 hover:bg-cyan-500/40 transition">
              <Users className="w-5 h-5" /> Max 5 per team
            </span>
            <a href="/rulebooks/Line Follower_ Rulebook.pdf" download className="px-4 py-2 bg-purple-500/20 text-purple-300 font-semibold rounded-lg border border-purple-400/30 flex items-center gap-2 hover:bg-purple-500/40 transition">
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
              <p>
                The Line Follower event challenges the navigation, logic, and problem-solving ability of autonomous robots. Robots must follow a predefined black path on a white arena using sensors and complete the track in the shortest possible time. Precision, stability, and efficient algorithms are key to winning.
              </p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">2. Robot Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Maximum dimensions: 25 cm × 25 cm × 25 cm</li>
                <li>Maximum weight: 3 kg (including battery)</li>
                <li>Robot must be fully autonomous</li>
                <li>No wireless communication allowed (Bluetooth, RF, Wi-Fi, etc.)</li>
                <li>Battery voltage must be below 16.8V</li>
                <li>Robot must be built by the team</li>
                <li>Ready-made robots are strictly prohibited</li>
                <li>All robots must pass pre-event inspection</li>
                <li>Robots failing inspection will be disqualified</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">3. Arena Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Arena size: 250 cm × 250 cm</li>
                <li>Surface: White paper</li>
                <li>Path color: Black</li>
                <li>Line width: 1.5 cm – 2.5 cm</li>
                <li>Maximum 2 attempts per team</li>
                <li>Best time will be considered</li>
                <li>Timer starts at start line and stops at finish line</li>
                <li>Judge’s stopwatch timing is final</li>
                <li>Maximum allowed time: 5 minutes</li>
                <li>Failure to complete within time results in disqualification</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">4. Rounds</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Initial Round: Each robot gets two attempts, best time is recorded</li>
                <li>Elimination Round: Robots failing to complete the track or violating rules are eliminated</li>
                <li>Final Round: Top robots compete for the fastest completion time</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">5. Rules & Regulations</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Restart from last checkpoint: Allowed if robot loses track or stops (timer continues)</li>
                <li>Restart from start line: Allowed if referee declares the run invalid (attempt is cancelled)</li>
                <li>A team may request a restart if robot loses the line or navigates incorrectly</li>
                <li>Reprogramming during a run is strictly prohibited</li>
                <li>Adding/removing hardware during a run is not allowed</li>
                <li>Sensor adjustments allowed only with referee permission</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">6. Marking Scheme / Scoring</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Time Taken: Fastest completion time ranks highest</li>
                <li>Accuracy: Line deviation may add time penalties</li>
                <li>Performance: Smooth and stable navigation may earn bonus points</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">7. Penalties</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Line deviation: Time penalty</li>
                <li>Human intervention: +5 seconds</li>
                <li>Failure to finish within 5 minutes: Disqualification</li>
                <li>Damaging the arena: Immediate disqualification</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">8. Disqualification</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Size or weight limits are exceeded</li>
                <li>Wireless control or communication is detected</li>
                <li>Robot fails inspection</li>
                <li>Rules or safety guidelines are violated</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">9. Safety Guidelines</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robots must have no sharp or harmful parts</li>
                <li>Must be safe to handle and operate</li>
                <li>Only authorized members may handle robots</li>
                <li>Follow all instructions from referees and coordinators</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">10. Appeals & Disputes</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Teams may submit appeals regarding timing or rule interpretation</li>
                <li>Referees’ and Event Committee decisions are final</li>
              </ul>
            </section>
            <p className="text-xs text-gray-400 mt-6">
              📌 Rules adapted from the official Roboyudh’26 Line Follower Rulebook
            </p>
          </div>
        </div>
        {/* Download Button */}
        <div className="flex justify-center mt-8">
          <a href="/rulebooks/Line Follower_Rulebook.pdf" download className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg flex items-center gap-2">
            <FileText className="w-6 h-6" /> Download Rulebook PDF
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default LineFollowerDetails;