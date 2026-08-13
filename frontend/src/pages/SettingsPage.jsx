import { 
  ArrowLeft, 
  Globe, 
  User, 
  Map, 
  Bell, 
  Lock, 
  HelpCircle, 
  Info, 
  Trash2, 
  LogOut,
  ChevronRight
} from 'lucide-react';

import { useTranslation } from '../LanguageContext';

export default function SettingsPage({ onBack, onNavigate, onLogout }) {
  const { t } = useTranslation();

  const SETTINGS_ITEMS = [
    { id: 'language', label: t.settings.language, Icon: Globe },
    { id: 'profile', label: t.settings.myProfile, Icon: User },
    { id: 'farm', label: t.settings.myFarm, Icon: Map },
    { id: 'notifications', label: t.settings.notificationPreferences, Icon: Bell },
    { id: 'password', label: t.settings.changePassword, Icon: Lock },
    { id: 'support', label: t.settings.helpSupport, Icon: HelpCircle },
    { id: 'about', label: t.settings.aboutAgriSense, Icon: Info },
    { id: 'delete', label: t.settings.deleteAccount, Icon: Trash2, danger: true },
    { id: 'logout', label: t.settings.logout, Icon: LogOut, danger: true },
  ];
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
            className="flex items-center gap-2 text-white/90 font-semibold text-sm px-4 py-2 rounded-full min-h-[44px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>{t.common.dashboardBtn}</span>
          </button>
        </div>

        <div className="px-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.settings.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      {/* ── Settings List ── */}
      <div className="px-5 pt-6 space-y-3">
        {SETTINGS_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'logout') {
                onLogout();
              } else {
                onNavigate(item.id);
              }
            }}
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-transform"
            style={{ 
              background: '#FFFFFF', 
              boxShadow: '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)' 
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: item.danger ? 'rgba(239,68,68,0.12)' : 'rgba(201,161,92,0.15)',
                  color: item.danger ? '#DC2626' : '#3D4A1F'
                }}
              >
                <item.Icon size={20} strokeWidth={2.5} />
              </div>
              <span 
                className="font-semibold text-sm" 
                style={{ color: item.danger ? '#DC2626' : '#2B2B24' }}
              >
                {item.label}
              </span>
            </div>
            <ChevronRight size={20} color="#6B6B5C" />
          </button>
        ))}
      </div>
    </div>
  );
}
