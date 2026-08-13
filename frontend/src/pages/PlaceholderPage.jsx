import { ArrowLeft, Clock } from 'lucide-react';
import { useTranslation } from '../LanguageContext';

export default function PlaceholderPage({ titleKey, onBack }) {
  const { t } = useTranslation();

  const titleMap = {
    farm: t.settings.myFarm,
    notifications: t.settings.notificationPreferences,
    password: t.settings.changePassword,
    support: t.settings.helpSupport,
    about: t.settings.aboutAgriSense,
    delete: t.settings.deleteAccount,
  };
  const title = titleMap[titleKey] || titleKey;
  return (
    <div className="min-h-screen pb-10" style={{ background: '#F7F3EA' }}>
      
      {/* ── Top Header Bar ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 100%)',
          boxShadow: '0 8px 32px rgba(61,74,31,0.22)',
          paddingBottom: '16px',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 font-semibold text-sm px-3.5 py-1.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.12)',
              transition: 'all 0.18s ease',
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>{t.settings.title}</span>
          </button>
        </div>

        <div className="px-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="px-5 pt-12 flex flex-col items-center justify-center text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(201,161,92,0.15)' }}
        >
          <Clock size={40} color="#C9A15C" />
        </div>
        <h2 className="text-xl font-bold text-[#2B2B24] mb-2">{t.placeholder.comingSoon}</h2>
        <p className="text-[#6B6B5C]">
          {t.placeholder.workingOnIt.replace('{title}', title)}
        </p>
      </div>

    </div>
  );
}
