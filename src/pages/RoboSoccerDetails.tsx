import { Trophy, Zap, Users, FileText, Shield } from 'lucide-react';

const RoboSoccerDetails = () => (
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
          <img src="/images/RoboSoccer.png" alt="Robo Soccer" className="h-48 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" /> RoboSoccer
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Compete in robot soccer matches. Score the most goals to win!
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 font-semibold rounded-lg border border-cyan-400/30 flex items-center gap-2 hover:bg-cyan-500/40 transition">
              <Users className="w-5 h-5" /> Max 5 per team
            </span>
            <a href="/rulebooks/RoboSoccer_Rulebook.pdf" download className="px-4 py-2 bg-purple-500/20 text-purple-300 font-semibold rounded-lg border border-purple-400/30 flex items-center gap-2 hover:bg-purple-500/40 transition">
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
              <p>RoboSoccer is an exciting robotics competition where two robots compete in a soccer-style match by pushing or hitting a tennis ball to score goals. Robots face off in a wooden arena with goalposts, and the team scoring the maximum number of goals within the allotted time advances to the next round.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">2. Robot Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Maximum weight: 5 kg (±5% tolerance)</li>
                <li>Maximum dimensions: 300 mm × 300 mm × 300 mm (including wheels) (±5% tolerance)</li>
                <li>Robots must be manually controlled</li>
                <li>Control can be wired or wireless</li>
                <li>Wired control must have minimum 2 meters cable length</li>
                <li>Wireless control must support multiple frequencies to avoid interference</li>
                <li>Only one participant is allowed to control the robot</li>
                <li>Robot must be self-powered</li>
                <li>Maximum allowable voltage: 12.6V</li>
                <li>External or off-board power sources are not allowed</li>
                <li>Robots may only push or hit the ball</li>
                <li>Gripping or holding mechanisms are strictly prohibited</li>
                <li>Robots must not have sharp edges</li>
                <li>At least 50% of the ball must be visible from the front of the robot at all times</li>
                <li>Prohibited: Liquid projectiles, electrical/invisible damage mechanisms, jamming devices, entangling/damaging mechanisms</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">3. Arena Specifications</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Arena dimensions: 180 cm × 360 cm</li>
                <li>Surface: Plywood base with green carpet</li>
                <li>Ball type: Standard tennis ball</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">4. Ticket Requirement</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Each participant must purchase a Roboyudh’26 event ticket to compete</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">5. Rounds & Match Format</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Match duration: 3 minutes per round</li>
                <li>Matches are played one-on-one</li>
                <li>The robot scoring the highest number of goals wins the round and advances</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">6. Rules & Regulations</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Only one operator may control the robot throughout the match</li>
                <li>Human interference is strictly prohibited</li>
                <li>Robots may push or hit the ball but cannot hold or grab it</li>
                <li>Match pauses longer than 1 minute will result in penalties</li>
                <li>Robots must not emit infrared light, though IR-distance sensors are allowed if they do not interfere</li>
                <li>If robots accidentally entangle, the match will be paused and resumed after correction</li>
                <li>A ball stuck in a corner for 10 seconds will be reset to the center after a 3-second pause</li>
                <li>Rules may be updated by the Head Coordinator if required</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">7. Marking Scheme / Scoring</h3>
              <ul className="list-disc list-inside ml-4">
                <li>The robot that scores the most goals wins the match</li>
                <li>Failure to comply with design rules may lead to disqualification</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">8. Penalties</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Extended pause (&gt;1 minute): Time penalty</li>
                <li>Use of illegal mechanisms: Immediate disqualification</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">9. Disqualification</h3>
              <ul className="list-disc list-inside ml-4">
                <li>A team will be disqualified if: Gripping or illegal mechanisms are used, Size or power supply limits are violated, Safety or design rules are not followed</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">10. Safety Guidelines</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Robots must be designed to avoid damage to the arena and participants</li>
                <li>Robots emitting harmful IR or electrical interference are prohibited</li>
                <li>Participant safety will always be prioritized during entanglement or stoppages</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xl font-bold text-cyan-200 mb-2">11. Appeals & Disputes</h3>
              <ul className="list-disc list-inside ml-4">
                <li>All decisions made by judges and organizers are final</li>
                <li>No rematches will be granted due to interference or disputes</li>
              </ul>
            </section>
            <p className="text-xs text-gray-400 mt-6">
              📌 Rules adapted from the official Roboyudh’26 RoboSoccer Rulebook
            </p>
          </div>
        </div>
        {/* Download Button */}
        <div className="flex justify-center mt-8">
          <a href="/rulebooks/RoboSoccer_Rulebook.pdf" download className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg flex items-center gap-2">
            <FileText className="w-6 h-6" /> Download Rulebook PDF
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default RoboSoccerDetails;
