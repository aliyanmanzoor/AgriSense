import { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { useTranslation } from '../LanguageContext';
import { getFarmer, updateNotificationPrefs } from '../api';

export default function NotificationPreferencesPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [prefs, setPrefs] = useState({
    weather: true,
    disease: true,
    general: true,
  });

  useEffect(() => {
    async function loadPrefs() {
      try {
        const farmer = await getFarmer(farmerId);
        if (farmer && farmer.notification_prefs) {
          const loadedPrefs = JSON.parse(farmer.notification_prefs);
          setPrefs({
            weather: loadedPrefs.weather !== undefined ? loadedPrefs.weather : true,
            disease: loadedPrefs.disease !== undefined ? loadedPrefs.disease : true,
            general: loadedPrefs.general !== undefined ? loadedPrefs.general : true,
          });
        }
      } catch (err) {
        setError(t.notifications.errorLoad);
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, [farmerId, t]);

  async function handleToggle(key) {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateNotificationPrefs(farmerId, newPrefs);
      setSuccess(t.notificationPrefs.saveSuccess);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(t.notificationPrefs.saveError);
      // Revert local state on error
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  }

  const preferenceItems = [
    {
      key: 'weather',
      title: t.notificationPrefs.weather,
      description: t.notificationPrefs.weatherDesc,
    },
    {
      key: 'disease',
      title: t.notificationPrefs.disease,
      description: t.notificationPrefs.diseaseDesc,
    },
    {
      key: 'general',
      title: t.notificationPrefs.general,
      description: t.notificationPrefs.generalDesc,
    },
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
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>{t.settings.title}</span>
          </button>
        </div>

        <div className="px-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.notificationPrefs.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {t.notificationPrefs.subtitle}
          </p>
        </div>
      </div>

      {/* ── Preferences List ── */}
      <div className="px-5 pt-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-[#6B6B5C] font-semibold">
            {t.notifications.loading}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl p-5 space-y-5 shadow-md">
              {preferenceItems.map((item, index) => (
                <div 
                  key={item.key} 
                  className={`flex items-center justify-between gap-4 ${
                    index > 0 ? 'pt-5 border-t border-[#E5DDD5]' : ''
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-sm text-[#2B2B24]">{item.title}</h3>
                    <p className="text-xs text-[#6B6B5C] leading-relaxed">{item.description}</p>
                  </div>
                  
                  {/* Styled Switch Toggle */}
                  <button
                    onClick={() => handleToggle(item.key)}
                    disabled={saving}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                    style={{
                      backgroundColor: prefs[item.key] ? '#4A5D23' : '#E5DDD5',
                    }}
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      style={{
                        transform: prefs[item.key] ? 'translateX(24px)' : 'translateX(4px)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold">
                {success}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
