import { useState } from 'react';
import { Wheat, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { register } from '../api';
import wheatHero from '../assets/wheat_hero.png';
import { useTranslation } from '../LanguageContext';

const CROP_OPTIONS = ['Wheat', 'Maize'];

export default function OnboardingPage({ onSuccess, onLogin }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    crop_type: 'Wheat',
    planting_date: '',
    farm_size: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const required = ['name', 'phone', 'location', 'crop_type', 'planting_date', 'farm_size', 'password', 'confirm_password'];
    for (const field of required) {
      if (!String(form[field]).trim()) {
        setError(t.onboarding.errorEmpty);
        return;
      }
    }
    if (form.password !== form.confirm_password) {
      setError(t.onboarding.errorMismatch);
      return;
    }
    if (parseFloat(form.farm_size) <= 0) {
      setError(t.onboarding.errorSize);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        crop_type: form.crop_type,
        planting_date: form.planting_date,
        farm_size: parseFloat(form.farm_size),
        password: form.password,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ── Shared style helpers ── */
  const inputStyle = {
    background: '#F7F3EA',
    color: '#2B2B24',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(61,74,31,0.08)',
    border: 'none',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '16px', // 16px prevents iOS zoom
    transition: 'box-shadow 0.18s ease',
  };
  const onFocus = e => { e.target.style.boxShadow = '0 0 0 2.5px #3D4A1F, 0 2px 8px rgba(61,74,31,0.08)'; };
  const onBlur  = e => { e.target.style.boxShadow = '0 2px 8px rgba(61,74,31,0.08)'; };

  const Label = ({ children }) => (
    <label
      className="block text-xs font-semibold uppercase tracking-widest mb-2"
      style={{ color: '#3D4A1F' }}
    >
      {children}
    </label>
  );

  return (
    <div className="min-h-screen relative flex items-start justify-center py-10">
      {/* ── Wheat background image ── */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${wheatHero})` }}
      />
      {/* ── Olive-tinted gradient overlay ── */}
      <div
        className="fixed inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(61,74,31,0.85) 0%, rgba(61,74,31,0.68) 45%, rgba(30,24,10,0.82) 100%)' }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 sm:px-0">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{
              background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)',
              boxShadow: '0 8px 28px rgba(201,161,92,0.38)',
            }}
          >
            <Wheat size={24} color="#2B2B24" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.onboarding.join}</h1>
          <p className="text-white/60 text-sm mt-1 font-medium tracking-wide">{t.onboarding.registerFarm}</p>
        </div>

        {/* Registration card */}
        <div
          className="rounded-3xl p-6 sm:p-7"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 20px 60px rgba(61,74,31,0.22), 0 4px 16px rgba(61,74,31,0.10)',
          }}
        >
          <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: '#2B2B24' }}>
            {t.onboarding.title}
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6B6B5C' }}>{t.onboarding.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <Label>{t.onboarding.fullNameLabel}</Label>
              <input style={inputStyle} type="text" placeholder={t.onboarding.namePlaceholder} value={form.name} onChange={set('name')} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Phone */}
            <div>
              <Label>{t.onboarding.phoneLabel}</Label>
              <input style={inputStyle} type="tel" placeholder={t.onboarding.phonePlaceholder} value={form.phone} onChange={set('phone')} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Location */}
            <div>
              <Label>{t.onboarding.locationLabel}</Label>
              <input style={inputStyle} type="text" placeholder={t.onboarding.locationPlaceholder} value={form.location} onChange={set('location')} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Crop type */}
            <div>
              <Label>{t.onboarding.cropTypeLabel}</Label>
              <select style={inputStyle} value={form.crop_type} onChange={set('crop_type')} onFocus={onFocus} onBlur={onBlur}>
                {CROP_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Planting date + farm size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label>{t.onboarding.plantingDateLabel}</Label>
                <input style={inputStyle} type="date" value={form.planting_date} onChange={set('planting_date')} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <Label>{t.onboarding.farmSizeLabel}</Label>
                <input style={inputStyle} type="number" min="0" step="0.25" placeholder={t.onboarding.farmSizePlaceholder} value={form.farm_size} onChange={set('farm_size')} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label>{t.onboarding.passwordLabel}</Label>
              <div className="relative">
                <input
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.onboarding.passwordPlaceholder}
                  value={form.password}
                  onChange={set('password')}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                  style={{ color: '#6B6B5C', lineHeight: 0 }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <Label>{t.onboarding.confirmPasswordLabel}</Label>
              <div className="relative">
                <input
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t.onboarding.confirmPasswordPlaceholder}
                  value={form.confirm_password}
                  onChange={set('confirm_password')}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                  style={{ color: '#6B6B5C', lineHeight: 0 }}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
                style={{ background: '#FFF1F1', color: '#C0392B', boxShadow: '0 2px 8px rgba(192,57,43,0.08)' }}
              >
                <AlertCircle size={15} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full text-white font-semibold text-base"
              style={{
                background: loading ? '#6B8048' : 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 100%)',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(61,74,31,0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 8px 28px rgba(61,74,31,0.42)'; } }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 6px 20px rgba(61,74,31,0.35)'; }}
            >
              {loading ? t.onboarding.registering : t.onboarding.createAccountBtn}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: '#EDE8DC' }} />
            <span className="text-xs font-medium" style={{ color: '#6B6B5C' }}>{t.onboarding.or}</span>
            <div className="flex-1 h-px" style={{ background: '#EDE8DC' }} />
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: '#6B6B5C' }}>
              {t.onboarding.alreadyHaveAccount}{' '}
              <button onClick={onLogin} className="font-semibold mx-1" style={{ color: '#3D4A1F' }}>
                {t.onboarding.signInLink}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom spacer for mobile scroll */}
        <div className="h-10" />
      </div>
    </div>
  );
}
