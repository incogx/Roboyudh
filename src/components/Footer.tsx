import { useState } from 'react';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';

const Footer = () => {
  const chiefPatrons = [
    'Dr. Mariazeena Johnson, Chancellor',
    'Dr. Maria Johnson, President',
    'Dr. Maria Catherine Johnson, Vice President',
    'Mr. R. Akash, Vice President',
  ];

  const convenors = [
    'Dr. L. Lakshmanan, Dean, School of Computing',
    'Dr. P. Ajitha, HOD (AI, BCT, CS, IOT)',
    'Dr. Senduru Srinivasulu, HOD (AIML, AI&R, DS)',
  ];

  const facultyCoordinators = [
    'Dr. Shanmuga Prabha P, Asst. Prof., CSE',
    'Dr. Nanthini N, Asst. Prof., CSE',
    'Dr. Muthulakshmi A, Asst. Prof., CSE',
    'Dr. Balapriya S, Asst. Prof., CSE',
    'Dr. Sarojini Premalatha J, Asst. Prof., CSE',
    'Dr. Geethanjali D, Associate Prof., CSE',
  ];

  const studentTeams = [
    {
      title: 'Event 1',
      people: [
        'Jenna Therese – 3rd Year, CSE (AI & ML)',
        'Kommi Lekha Sree – 3rd Year, CSE (Data Science)',
        'Tissina Gold – 3rd Year, CSE (Data Science)',
        'Vishnu K – 2nd Year, AI & ML',
        'Gunashree – 2nd Year, AI & ML',
      ],
    },
    {
      title: 'Event 2',
      people: [
        'Ayesha – 3rd Year, AI',
        'Guru Rishikesh – 3rd Year, AI',
        'Hari Krishna – 3rd Year, AI',
        'Goel Kishore – 3rd Year, AI',
        'Ameer Suhail – 3rd Year, AI',
      ],
    },
    {
      title: 'Event 3',
      people: [
        'Thilgavathy N – 3rd Year, CSE (Data Science)',
        'Ashvika K – 3rd Year, CSE (AI)',
        'Indrika Manohari – 3rd Year, CSE (Data Science)',
        'Praveen – 2nd Year, AI & ML',
        'Naveen – 2nd Year, AI & ML',
      ],
    },
    {
      title: 'Event 4',
      people: [
        'Nitheesh T – 2nd Year, AI & ML',
        'Charan Puvada – 3rd Year, Data Science',
        'Ishwarya Ramesh – 2nd Year, Data Science',
        'Mohammed Junaith Sulthan J – 2nd Year, AI & ML',
        'Alphan Jenfus – 2nd Year, AI & ML',
      ],
    },
    {
      title: 'Event 5',
      people: [
        'Alvin Sudhan – 3rd Year, AI & ML',
        'Vishwa V – 3rd Year, AI & ML',
        'Kamali S – 3rd Year, AI',
        'Sivaprasana BR – 2nd Year, AI & ML',
        'Santhosh – 2nd Year, AI & ML',
      ],
    },
    {
      title: 'Media Team',
      people: [
        'Neil Sam – 2nd Year, CSE',
        'Atharsh – 2nd Year, CSE',
        'Rahul Rajan – 2nd Year, CSE',
        'Reyan – 2nd Year, CSE',
        'Yogesh – 2nd Year, CSE',
      ],
    },
    {
      title: 'Volunteering Team',
      people: [
        'Sathvikaa Sri – 3rd Year, CSE (DS) (H)',
        'Subin Tony – 3rd Year, CSE (AI) (H)',
        'Sandhiya – 1st Year, AI',
        'Mukesh Gokul – 2nd Year, Data Science',
        'Raj – 2nd Year, Data Science',
        'Divya – 2nd Year, Data Science',
        'Chakradhar – 2nd Year, AI & ML',
      ],
    },
  ];

  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const toggleTeam = (title: string) => {
    setExpandedTeams((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <footer className="bg-black border-t border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text mb-4">
              ROBOYUDH 2026
            </h3>
            <p className="text-gray-400 mb-4">
              National Level Intercollege Tech Event
            </p>
            <p className="text-gray-400 text-sm">
              Sathyabama Institute of Science and Technology
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-cyan-400 mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                <Mail className="w-5 h-5" />
                <span>organizers.roboyudh@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                <Phone className="w-5 h-5" />
                <div className="flex flex-col leading-snug">
                  <span>+91 89258 10559 – Mr. Lakshmi Narayanan</span>
                  <span>+91 70193 17697 – Mr. Aneesh M</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                <MapPin className="w-5 h-5" />
                <span>Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-cyan-400 mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              {[
                { Icon: Instagram, href: 'https://www.instagram.com/sathyabama.official?igsh=Yjh5bWlibHBwaTlt' },
              ].map(({ Icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  className="w-10 h-10 rounded-lg bg-gray-900 border border-cyan-500/20 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/30 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Leadership & Coordinators */}
        <div className="space-y-6 mb-10">
          <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border-2 border-cyan-400/40 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 text-center">
            <h5 className="text-cyan-100 font-semibold mb-3 text-base md:text-lg uppercase tracking-wider">Chief Patrons</h5>
            <ul className="space-y-2 text-gray-100 text-sm md:text-base">
              {chiefPatrons.map((person) => (
                <li key={person} className="leading-snug">
                  {person}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-cyan-300/30 rounded-2xl p-5 shadow-xl shadow-cyan-500/15 text-center">
              <h5 className="text-cyan-100 font-semibold mb-3 text-base uppercase tracking-wide">Convenors</h5>
              <ul className="space-y-2 text-gray-100 text-sm">
                {convenors.map((person) => (
                  <li key={person} className="leading-snug">
                    {person}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-cyan-300/30 rounded-2xl p-5 shadow-xl shadow-cyan-500/15 text-center">
              <h5 className="text-cyan-100 font-semibold mb-3 text-base uppercase tracking-wide">Faculty Coordinators</h5>
              <ul className="space-y-2 text-gray-100 text-sm">
                {facultyCoordinators.map((person) => (
                  <li key={person} className="leading-snug">
                    {person}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-cyan-300/30 rounded-2xl p-5 shadow-xl shadow-cyan-500/15">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h5 className="text-cyan-300 font-semibold text-sm uppercase tracking-wide">Student Coordinators</h5>
              <p className="text-xs text-gray-400">Tap a team to expand names</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {studentTeams.map(({ title, people }) => {
                const expanded = expandedTeams[title];
                const visiblePeople = expanded ? people : people.slice(0, 2);

                return (
                  <div key={title} className="bg-black/40 border border-cyan-500/10 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h6 className="text-cyan-200 font-semibold text-xs uppercase tracking-wide">{title}</h6>
                      <button
                        onClick={() => toggleTeam(title)}
                        className="text-cyan-400 text-xs font-semibold hover:text-cyan-200 transition-colors"
                      >
                        {expanded ? 'Show Less' : 'Show More'}
                      </button>
                    </div>
                    <ul className="space-y-2 text-gray-200 text-sm">
                      {visiblePeople.map((person) => (
                        <li key={person} className="leading-snug">
                          {person}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-500/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; 2026 ROBOYUDH. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="/privacy-policy" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="/terms-and-conditions" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Terms & Conditions
              </a>
              <a href="/cancellations-refunds" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Cancellations & Refunds
              </a>
              <a href="/shipping-policy" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Shipping Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"></div>
    </footer>
  );
};

export default Footer;
