import { ArrowLeft, Check } from 'lucide-react';
import { useTranslation } from '../LanguageContext';

export default function LanguagePage({ onBack }) {
  const { language, setLanguage } = useTranslation();

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
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Settings</span>
          </button>
        </div>

        <div className="px-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">Language</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            Choose your preferred language
          </p>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-4">
        
        <button
          onClick={() => setLanguage('en')}
          className="w-full rounded-2xl p-5 flex items-center justify-between transition-all"
          style={{
            background: '#FFFFFF',
            boxShadow: language === 'en' 
              ? '0 0 0 2px #C9A15C, 0 8px 24px rgba(201,161,92,0.15)' 
              : '0 4px 24px rgba(61,74,31,0.10)',
          }}
        >
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg" style={{ color: '#2B2B24' }}>English</span>
            <span className="text-sm font-medium" style={{ color: '#6B6B5C' }}>English (US)</span>
          </div>
          {language === 'en' && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#C9A15C' }}>
              <Check size={14} color="#2B2B24" strokeWidth={3} />
            </div>
          )}
        </button>

        <button
          onClick={() => setLanguage('ur')}
          className="w-full rounded-2xl p-5 flex items-center justify-between transition-all"
          style={{
            background: '#FFFFFF',
            boxShadow: language === 'ur' 
              ? '0 0 0 2px #C9A15C, 0 8px 24px rgba(201,161,92,0.15)' 
              : '0 4px 24px rgba(61,74,31,0.10)',
          }}
        >
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg" style={{ fontFamily: "'Noto Nastaliq Urdu', sans-serif", color: '#2B2B24' }}>اردو</span>
            <span className="text-sm font-medium mt-1" style={{ color: '#6B6B5C' }}>Urdu (Pakistan)</span>
          </div>
          {language === 'ur' && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#C9A15C' }}>
              <Check size={14} color="#2B2B24" strokeWidth={3} />
            </div>
          )}
        </button>

      </div>
    </div>
  );
}
