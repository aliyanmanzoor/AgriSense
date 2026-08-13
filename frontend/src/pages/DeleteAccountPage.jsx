import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useTranslation } from '../LanguageContext';
import { deactivateAccount } from '../api';

export default function DeleteAccountPage({ farmerId, onBack, onDeactivated }) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CONFIRM_WORD = 'DELETE';

  async function handleDelete(e) {
    e.preventDefault();
    if (confirmText !== CONFIRM_WORD) {
      setError(t.deleteAccount.errorMatch);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deactivateAccount(farmerId);
      onDeactivated();
    } catch (err) {
      setError(err.message || t.deleteAccount.errorGeneric);
      setLoading(false);
    }
  }

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
            <span>{t.settings.title}</span>
          </button>
        </div>

        <div className="px-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.deleteAccount.title}</h1>
        </div>
      </div>

      {/* ── Warning Content ── */}
      <div className="px-5 pt-6 space-y-6">
        <div 
          className="rounded-2xl p-5 border border-red-200/60 space-y-3"
          style={{ background: '#FFF5F5', boxShadow: '0 4px 20px rgba(220,38,38,0.06)' }}
        >
          <div className="flex items-center gap-2.5 text-red-600">
            <Trash2 size={24} />
            <h2 className="text-lg font-bold">{t.deleteAccount.warningTitle}</h2>
          </div>
          <p className="text-sm font-medium text-red-700/80 leading-relaxed">
            {t.deleteAccount.warningText}
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="rounded-2xl bg-white p-5 space-y-3 shadow-md">
            <label className="block text-sm font-semibold text-[#3D4A1F]">
              {t.deleteAccount.confirmLabel.replace('{confirmWord}', `"${CONFIRM_WORD}"`)}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={t.deleteAccount.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-[#E5DDD5] bg-[#FAF6F0] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-base"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={confirmText !== CONFIRM_WORD || loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
            style={{
              background: '#DC2626',
              boxShadow: confirmText === CONFIRM_WORD ? '0 6px 20px rgba(220,38,38,0.25)' : 'none',
            }}
          >
            {loading ? t.deleteAccount.deactivating : t.deleteAccount.deleteBtn}
          </button>
        </form>
      </div>

    </div>
  );
}
