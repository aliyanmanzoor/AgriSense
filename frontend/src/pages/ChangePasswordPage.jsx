import { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useTranslation } from '../LanguageContext';
import { API_BASE } from '../api';


const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';

const inputBaseStyle = {
  width: '100%',
  padding: '13px 44px 13px 44px',
  borderRadius: '16px',
  border: 'none',
  background: '#F7F3EA',
  color: '#2B2B24',
  fontSize: '16px',
  fontWeight: '500',
  outline: 'none',
  transition: 'box-shadow 0.2s ease',
};

function PasswordField({ label, placeholder, value, onChange, id }) {
  const [show, setShow] = useState(false);
  const onFocus = (e) => { e.target.style.boxShadow = '0 0 0 2px #3D4A1F inset'; };
  const onBlur  = (e) => { e.target.style.boxShadow = 'none'; };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#3D4A1F' }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C] pointer-events-none">
          <Lock size={18} />
        </div>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={inputBaseStyle}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B6B5C] hover:text-[#3D4A1F] transition-colors p-2"
          tabIndex={-1}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [current, setCurrent]   = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!current || !newPwd || !confirm) {
      setError(t.changePassword.errorEmpty);
      return;
    }
    if (newPwd.length < 6) {
      setError(t.changePassword.errorShort);
      return;
    }
    if (newPwd !== confirm) {
      setError(t.changePassword.errorMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/farmer/${farmerId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.detail === 'Current password is incorrect') {
          setError(t.changePassword.errorIncorrect);
        } else {
          setError(data.detail || t.changePassword.errorGeneric);
        }
        return;
      }
      setSuccess(true);
      setCurrent('');
      setNewPwd('');
      setConfirm('');
    } catch {
      setError(t.changePassword.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F7F3EA' }}>
      {/* Header */}
      <div
        className="pt-10 pb-8 rounded-b-[40px] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3D4A1F 0%, #5a6e2c 100%)', boxShadow: '0 8px 32px rgba(61,74,31,0.18)' }}
      >
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: '#C9A15C' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 rounded-full opacity-10 pointer-events-none" style={{ background: '#C9A15C' }} />

        <div className="px-5 mb-4 relative z-10">
          <button type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors min-h-[44px]"
            style={{ color: '#F7F3EA', background: 'rgba(255,255,255,0.12)' }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            <span>{t.settings.title}</span>
          </button>
        </div>

        <div className="px-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(201,161,92,0.20)' }}>
            <Lock size={22} color="#C9A15C" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t.changePassword.title}</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 mt-6">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-3xl p-6 space-y-5" style={{ boxShadow: cardShadow }}>

            {/* Success */}
            {success && (
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(61,74,31,0.08)' }}
              >
                <CheckCircle size={18} color="#3D4A1F" />
                <p className="text-sm font-semibold" style={{ color: '#3D4A1F' }}>
                  {t.changePassword.success}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: '#FFF1F1', border: '1px solid #FFCDD2' }}
              >
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            <PasswordField
              id="current-password"
              label={t.changePassword.currentPassword}
              placeholder={t.changePassword.currentPlaceholder}
              value={current}
              onChange={e => setCurrent(e.target.value)}
            />

            <div className="border-t border-[#F0EBE0]" />

            <PasswordField
              id="new-password"
              label={t.changePassword.newPassword}
              placeholder={t.changePassword.newPlaceholder}
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
            />

            <PasswordField
              id="confirm-password"
              label={t.changePassword.confirmPassword}
              placeholder={t.changePassword.confirmPlaceholder}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-4 rounded-full font-bold text-white flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98] disabled:opacity-70"
            style={{ background: '#3D4A1F', boxShadow: '0 4px 16px rgba(61,74,31,0.30)' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{t.changePassword.updating}</span>
              </>
            ) : (
              <>
                <Lock size={18} strokeWidth={2.5} />
                <span>{t.changePassword.updateBtn}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
