import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../LanguageContext';

export default function AboutPage({ onBack }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F7F3EA' }}>
      <div className="pt-10 pb-6 rounded-b-[40px] shadow-sm relative overflow-hidden" style={{ background: '#3D4A1F' }}>
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full opacity-10" style={{ background: '#C9A15C' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full opacity-10" style={{ background: '#C9A15C' }} />

        <div className="px-5 mb-4">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
            style={{ color: '#F7F3EA', background: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 text-center mt-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Agri<span style={{ color: '#C9A15C' }}>Sense</span></h1>
          <p className="text-white/60 text-xs mt-1 font-medium tracking-wide uppercase">
            {t.about.version}
          </p>
        </div>
      </div>

      <div className="px-5 mt-8 max-w-sm mx-auto text-center space-y-6">
        <div className="rounded-3xl p-6 bg-white" style={{ boxShadow: '0 4px 24px rgba(61,74,31,0.10)' }}>
          <h2 className="text-xl font-bold text-[#2B2B24] mb-3">{t.about.title}</h2>
          <p className="text-sm leading-relaxed text-[#6B6B5C]">
            {t.about.description}
          </p>
        </div>
        
        <p className="text-xs font-semibold text-[#3D4A1F] opacity-70">
          {t.about.footer}
        </p>
      </div>
    </div>
  );
}
