import React from 'react';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';
import { Shield, Mail, Trash2, Camera, Mic, Image, Key, BarChart3, Lock, Clock } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    title: 'Information We Collect',
    content: 'To provide a premium AI training and linguistic grounding experience, we collect the following types of information:',
    subsections: [
      {
        title: 'Native Permissions & Media Data',
        items: [
          { icon: Camera, label: 'Camera Data', desc: 'With your explicit permission, we access your device camera to capture visual data (photos and videos) necessary for AI visual training tasks.' },
          { icon: Mic, label: 'Audio/Microphone Data', desc: 'With your explicit permission, we access your microphone to record voice inputs, linguistic samples, and audio data for AI language grounding.' },
          { icon: Image, label: 'Media Gallery', desc: 'We access your device\'s photo and media library to allow you to select previously captured media for processing or to save completed task media.' },
        ]
      },
      {
        title: 'Account & Authentication Information',
        items: [
          { icon: Key, label: 'Clerk Authentication', desc: 'We use Clerk to secure your account. When you sign up, we collect your email address, name, and account identifier.' },
          { icon: Lock, label: 'Supabase Database Storage', desc: 'Your profiles, submitted tasks, activity logs, and wallet balances are stored securely using Supabase.' },
        ]
      },
      {
        title: 'Crash & Performance Monitoring',
        items: [
          { icon: BarChart3, label: 'Sentry', desc: 'We collect anonymous device diagnostic and crash logs to monitor system health, optimize performance, and troubleshoot crashes.' },
        ]
      },
    ]
  },
  {
    icon: Lock,
    title: 'How We Use Your Information',
    content: '',
    items: [
      'To verify, evaluate, and award users for AI training and grounding tasks.',
      'To manage accounts, secure user profiles, and process rewards.',
      'To detect, prevent, and address technical performance issues (via Sentry).',
      'All data transmission is encrypted in transit using HTTPS/SSL.',
    ]
  },
  {
    icon: Clock,
    title: 'Data Retention and Deletion',
    content: 'We retain your personal data only as long as necessary for the purposes set out in this Privacy Policy.',
    items: [
      'Account Deletion: Users can request the complete deletion of their account and all associated data at any time by contacting our support team at support@xumai.app or submitting a deletion request in the App. Upon request, all personal data stored in Clerk and Supabase will be permanently erased within 30 days.',
    ]
  },
  {
    icon: Trash2,
    title: 'Delete Your Account',
    content: 'To delete your account, kindly send an email with the subject line "Delete Account" to:',
    emailAction: { label: 'infolingualinkai@gmail.com', href: 'mailto:infolingualinkai@gmail.com?subject=Delete Account' }
  },
  {
    icon: Lock,
    title: 'Security of Your Data',
    content: 'The security of your data is important to us. We use industry-standard secure cloud infrastructure provided by Supabase and Clerk to prevent unauthorized access, alteration, or disclosure of your information.'
  },
  {
    icon: Mail,
    title: 'Contact Us',
    content: 'If you have any questions or concerns about this Privacy Policy, please contact us:',
    contacts: [
      { label: 'support@xumai.app', href: 'mailto:support@xumai.app' },
      { label: 'https://xumai.app', href: 'https://xumai.app' },
    ]
  }
];

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Shield size={14} /> Privacy Policy
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold mb-4 outfit tracking-tight">
              Your <span className="text-blue-500">Privacy</span> Matters
            </h1>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              We are transparent about how we collect, use, and protect your data.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-slate-400 text-sm">
              <Clock size={14} />
              Effective Date: May 23, 2026
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-10 hover:border-blue-500/20 transition-colors duration-500"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <section.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold outfit text-white">{section.title}</h2>
                    {section.content && (
                      <p className="text-slate-400 mt-2 leading-relaxed">{section.content}</p>
                    )}
                  </div>
                </div>

                {/* Subsections (for Information We Collect) */}
                {section.subsections?.map((sub, subIdx) => (
                  <div key={subIdx} className="ml-4 mb-6 last:mb-0">
                    <h3 className="text-base font-medium text-slate-200 mb-4">{sub.title}</h3>
                    <div className="space-y-4">
                      {sub.items.map((item, itemIdx) => {
                        const Icon = item.icon;
                        return (
                          <div key={itemIdx} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{item.label}</p>
                              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Simple list items */}
                {section.items && (
                  <ul className="space-y-3 ml-4">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3 text-slate-400">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Email action (Delete Account) */}
                {section.emailAction && (
                  <div className="ml-4 mt-4">
                    <a
                      href={section.emailAction.href}
                      className="inline-flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Mail size={18} />
                      {section.emailAction.label}
                    </a>
                  </div>
                )}

                {/* Contact links */}
                {section.contacts && (
                  <div className="ml-4 mt-4 space-y-3">
                    {section.contacts.map((contact, cIdx) => (
                      <a
                        key={cIdx}
                        href={contact.href}
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      >
                        <Mail size={16} />
                        {contact.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
