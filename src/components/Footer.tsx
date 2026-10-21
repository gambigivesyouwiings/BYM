import Link from 'next/link';
import { Flame, MapPin, Phone, Mail, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">
                  MCK <span className="gradient-text">Beyond</span>
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 -mt-0.5">
                  Youth Ministries
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering the next generation to live boldly for Christ. Going beyond
              limits, beyond walls, beyond expectations — for His glory.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Youtube, href: '#' },
                { Icon: Twitter, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-600/20 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: '/' },
                { label: 'About Us', href: '/#about' },
                { label: 'Events', href: '/events' },
                { label: 'My Tickets & Payments', href: '/tickets' },
                { label: 'Sermons', href: '/#sermons' },
                { label: 'Gallery', href: '/#gallery' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ministry */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Get Involved
            </h3>
            <ul className="space-y-3">
              {[
                'Join a Small Group',
                'Volunteer',
                'Worship Team',
                'Prayer Ministry',
                'Outreach & Missions',
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-400 hover:text-accent transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span className="text-sm text-slate-400">
                  MCK Beyond Sanctuary,<br />
                  Nairobi, Kenya
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-slate-400">+254 700 000 000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-slate-400">youth@mckbeyond.org</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MCK Beyond Youth Ministries. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
