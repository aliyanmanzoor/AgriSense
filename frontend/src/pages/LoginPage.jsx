import { useState } from 'react';
import { Wheat, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { login } from '../api';
import { useTranslation } from '../LanguageContext';

export default function LoginPage({ onLogin, onSignUp }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError(t.login.errorEmpty);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(phone.trim(), password);
      onLogin(data.farmer_id, data.farmer_name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Wheat hero background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1600&auto=format&fit=crop')`,
        }}
      />
      {/* Rich olive-tinted gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(61,74,31,0.82) 0%, rgba(61,74,31,0.65) 50%, rgba(30,24,10,0.80) 100%)' }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-5 sm:px-0">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)',
              boxShadow: '0 8px 32px rgba(201,161,92,0.40)',
            }}
          >
            <Wheat size={28} color="#2B2B24" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AgriSense</h1>
          <p className="text-white/60 mt-1 text-sm font-medium tracking-wide">{t.brand.tagline}</p>
        </div>

        {/* Login card */}
        <div
          className="rounded-3xl p-6 sm:p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 20px 60px rgba(61,74,31,0.22), 0 4px 16px rgba(61,74,31,0.10)',
          }}
        >
          <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#2B2B24' }}>
            {t.login.welcomeBack}
          </h2>
          <p className="text-sm mb-7" style={{ color: '#6B6B5C' }}>{t.login.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#3D4A1F' }}
              >
                {t.login.phoneLabel}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t.login.phonePlaceholder}
                className="w-full px-4 py-3.5 rounded-2xl text-base"
                style={{
                  background: '#F7F3EA',
                  color: '#2B2B24',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(61,74,31,0.08)',
                  border: 'none',
                }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2.5px #3D4A1F, 0 2px 8px rgba(61,74,31,0.08)'; }}
                onBlur={e => { e.target.style.boxShadow = '0 2px 8px rgba(61,74,31,0.08)'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#3D4A1F' }}
              >
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t.login.passwordPlaceholder}
                  className="w-full px-4 py-3.5 rounded-2xl text-base"
                  style={{
                    background: '#F7F3EA',
                    color: '#2B2B24',
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(61,74,31,0.08)',
                    border: 'none',
                    paddingRight: '44px',
                  }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2.5px #3D4A1F, 0 2px 8px rgba(61,74,31,0.08)'; }}
                  onBlur={e => { e.target.style.boxShadow = '0 2px 8px rgba(61,74,31,0.08)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                  style={{ color: '#6B6B5C', lineHeight: 0 }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={17} strokeWidth={2} />
                    : <Eye size={17} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
                style={{
                  background: '#FFF1F1',
                  color: '#C0392B',
                  boxShadow: '0 2px 8px rgba(192,57,43,0.08)',
                }}
              >
                <AlertCircle size={15} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full text-white font-semibold text-base mt-2"
              style={{
                background: loading ? '#6B8048' : 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 100%)',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(61,74,31,0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transform: 'scale(1)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 8px 28px rgba(61,74,31,0.42)'; } }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 6px 20px rgba(61,74,31,0.35)'; }}
            >
              {loading ? t.login.signingIn : t.login.signInBtn}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#EDE8DC' }} />
            <span className="text-xs font-medium" style={{ color: '#6B6B5C' }}>{t.login.or}</span>
            <div className="flex-1 h-px" style={{ background: '#EDE8DC' }} />
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: '#6B6B5C' }}>
              {t.login.newFarmer}{' '}
              <button
                onClick={onSignUp}
                className="font-semibold mx-1"
                style={{ color: '#3D4A1F' }}
              >
                {t.login.createAccount}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
