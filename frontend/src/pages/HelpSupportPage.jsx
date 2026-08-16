import { useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../LanguageContext';

export default function HelpSupportPage({ onBack }) {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F7F3EA' }}>
      <div className="pt-10 pb-6 rounded-b-[40px] shadow-sm relative overflow-hidden" style={{ background: '#3D4A1F' }}>
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: '#C9A15C' }} />
        
        <div className="px-5 mb-4 relative z-10">
          <button onClick={onBack} className="w-11 h-11 rounded-full flex items-center justify-center transition-colors" style={{ color: '#F7F3EA', background: 'rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.helpSupport.title}</h1>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2" style={{ boxShadow: '0 4px 24px rgba(61,74,31,0.10)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,161,92,0.15)', color: '#C9A15C' }}>
              <Phone size={20} />
            </div>
            <p className="text-sm font-bold text-[#2B2B24]">{t.helpSupport.phone}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2" style={{ boxShadow: '0 4px 24px rgba(61,74,31,0.10)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(61,74,31,0.15)', color: '#3D4A1F' }}>
              <MessageCircle size={20} />
            </div>
            <p className="text-sm font-bold text-[#2B2B24]">{t.helpSupport.whatsapp}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D4A1F] mb-3">{t.helpSupport.faqTitle}</h2>
          <div className="space-y-3">
            {t.helpSupport.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl overflow-hidden transition-all duration-300" style={{ boxShadow: '0 2px 12px rgba(61,74,31,0.06)' }}>
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-semibold text-sm text-[#2B2B24]">{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} color="#6B6B5C" /> : <ChevronDown size={16} color="#6B6B5C" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-[#6B6B5C] leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
