import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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
                <span>roboyudh2026@sathyabama.ac.in</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                <Phone className="w-5 h-5" />
                <span>+91 98765 43210</span>
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
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Linkedin, href: '#' },
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

        <div className="border-t border-cyan-500/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; 2026 ROBOYUDH. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Rules & Regulations
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
