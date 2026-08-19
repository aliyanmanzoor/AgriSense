import { useState, useEffect } from 'react';
import {
  Wheat,
  Home,
  Cloud,
  CalendarDays,
  Microscope,
  BarChart2,
  Bell,
  User,
  Sun,
  Lightbulb,
  ScanLine,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { getFarmer, API_BASE } from '../api';
import wheatHero from '../assets/wheat_hero.png';
import maizeHero from '../assets/maize_hero.png';
import { useTranslation } from '../LanguageContext';

const NAV_ICONS = [
  { id: 'home',     Icon: Home },
  { id: 'weather',  Icon: Cloud },
  { id: 'calendar', Icon: CalendarDays },
  { id: 'disease',  Icon: Microscope },
  { id: 'yield',    Icon: BarChart2 },
  { id: 'alerts',   Icon: Bell },
];

function getToday() {
  return new Date().toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getCropPhoto(cropType) {
  if (!cropType) return wheatHero;
  const lower = cropType.toLowerCase();
  if (lower.includes('maize') || lower.includes('corn')) {
    return maizeHero;
  }
  return wheatHero;
}

/* ── Shared card shadows ── */
const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';
const heroShadow = '0 8px 40px rgba(61,74,31,0.18), 0 2px 10px rgba(61,74,31,0.10)';

/* ── Quick action definitions ── */
const QUICK_ICONS = [
  {
    id: 'weather',
    Icon: Cloud,
    iconColor: '#3B82F6',
    iconBg: 'rgba(147,197,253,0.25)',
  },
  {
    id: 'disease',
    Icon: ScanLine,
    iconColor: '#C9A15C',
    iconBg: 'rgba(201,161,92,0.18)',
  },
  {
    id: 'calendar',
    Icon: CalendarDays,
    iconColor: '#3D4A1F',
    iconBg: 'rgba(61,74,31,0.12)',
  },
  {
    id: 'yield',
    Icon: TrendingUp,
    iconColor: '#7C3AED',
    iconBg: 'rgba(167,139,250,0.18)',
  },
];

// Module-level cache for stale-while-revalidate pattern
let cachedProfile = null;
let cachedCropType = null;
let cachedFarmerId = null;

export default function DashboardPage({ farmerName, farmerId, onNavigate }) {
  const { t } = useTranslation();
  const [cropType, setCropType] = useState(cachedFarmerId === farmerId ? cachedCropType : null);
  const [profile, setProfile] = useState(cachedFarmerId === farmerId ? cachedProfile : null);
  const [loadingCrop, setLoadingCrop] = useState(cachedFarmerId !== farmerId);

  useEffect(() => {
    if (!farmerId) {
      setLoadingCrop(false);
      return;
    }
    
    // Only show loading state if we don't have cached data
    if (cachedFarmerId !== farmerId) {
      setLoadingCrop(true);
    }
    
    // Always fetch to get the freshest data in background (stale-while-revalidate)
    getFarmer(farmerId)
      .then((data) => {
        setProfile(data);
        cachedProfile = data;
        cachedFarmerId = farmerId;
        
        // The farmer profile doesn't include crop_type directly;
        // fall back to the crop-calendar endpoint via a second call.
        return fetch(`${API_BASE}/crop-calendar/${farmerId}`)
          .then(r => r.json())
          .then(cal => {
            const first = cal?.crops?.[0];
            const cType = first?.crop_type || 'Wheat';
            setCropType(cType);
            cachedCropType = cType;
          });
      })
      .catch(() => { 
        setCropType('Wheat'); 
        cachedCropType = 'Wheat';
      })
      .finally(() => { setLoadingCrop(false); });
  }, [farmerId]);

  const cropPhoto = getCropPhoto(cropType);
  const photoUrl = profile?.profile_photo ? `${API_BASE}/${profile.profile_photo}` : null;
  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : (farmerName ? farmerName.charAt(0).toUpperCase() : '?');

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F7F3EA' }}>

      {/* ── Top nav bar ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 100%)',
          boxShadow: '0 8px 32px rgba(61,74,31,0.22)',
          paddingBottom: '12px',
        }}
      >
        {/* Brand row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)',
                boxShadow: '0 3px 10px rgba(201,161,92,0.35)',
              }}
            >
              <Wheat size={18} color="#2B2B24" strokeWidth={2} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AgriSense</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('settings')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Settings size={22} />
            </button>
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)' }}
              onClick={() => onNavigate?.('profile')}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#2B2B24] font-bold text-sm">{initial}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation pills */}
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
          {NAV_ICONS.map(({ id, Icon }, idx) => {
            let label = '';
            if (id === 'home') label = t.dashboard.navHome;
            if (id === 'weather') label = t.dashboard.navWeather;
            if (id === 'calendar') label = t.dashboard.navCalendar;
            if (id === 'disease') label = t.dashboard.navDisease;
            if (id === 'yield') label = t.dashboard.navYield;
            if (id === 'alerts') label = t.dashboard.navAlerts;
            return (
              <button
                key={id}
                onClick={() => {
                  if (id === 'weather') onNavigate?.('weather');
                  else if (id === 'home') onNavigate?.('dashboard');
                else if (id === 'calendar') onNavigate?.('calendar');
                else if (id === 'disease') onNavigate?.('disease');
                else if (id === 'yield') onNavigate?.('yield');
                else if (id === 'alerts') onNavigate?.('alerts');
              }}
              className="flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{
                background: idx === 0 ? '#C9A15C' : 'rgba(255,255,255,0.10)',
                color: idx === 0 ? '#2B2B24' : 'rgba(255,255,255,0.75)',
                boxShadow: idx === 0 ? '0 3px 10px rgba(201,161,92,0.35)' : 'none',
                transition: 'all 0.18s ease',
              }}
                onMouseEnter={e => { if (idx !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { if (idx !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
              >
                <Icon size={15} strokeWidth={2} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="px-5 pt-6 space-y-5">

        {/* ── Hero greeting card ── */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 60%, #5C6E30 100%)',
            boxShadow: heroShadow,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C9A15C' }}>
                  {t.dashboard.goodDay}
                </p>
                <Sun size={12} color="#C9A15C" strokeWidth={2.5} />
              </div>
              <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">
                {farmerName || t.dashboard.farmerPlaceholder}
              </h2>
              <p className="text-white/50 text-xs mt-2">{getToday()}</p>
            </div>
            {/* Avatar — User icon inside wheat-gold circle */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20"
              style={{
                background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)',
                boxShadow: '0 3px 12px rgba(201,161,92,0.35)',
              }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-[#2B2B24] font-bold">{initial}</span>
              )}
            </div>
          </div>

          {/* Quick stats row */}
          <div
            className="grid grid-cols-3 gap-3 mt-5 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
          >
            {[
              { label: 'Crop',   value: loadingCrop ? '...' : cropType },
              { label: 'Season', value: 'Rabi' },
              { label: 'Status', value: 'Growing' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#C9A15C' }}>
                  {s.label}
                </p>
                <p className="text-white text-sm font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Crop photo card ── */}
        <div
          className="rounded-3xl overflow-hidden relative h-52"
          style={{ boxShadow: heroShadow, background: '#3D4A1F' }}
        >
          {!loadingCrop && cropType ? (
            <>
              <img
                src={cropPhoto}
                alt={`${cropType} crop`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,24,10,0.80) 0%, rgba(30,24,10,0.20) 55%, transparent 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest"
                  style={{ background: '#C9A15C', color: '#2B2B24' }}
                >
                  {t.dashboard.yourCrop}
                </span>
                <h3 className="text-white text-xl font-bold tracking-tight">{cropType}</h3>
                <p className="text-white/60 text-xs mt-0.5">{t.dashboard.cropHint}</p>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full"></div>
            </div>
          )}
        </div>

        {/* ── Quick actions section ── */}
        <div>
          <h3 className="font-bold text-[#2B2B24] mb-3 text-lg px-1">{t.dashboard.quickActions}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {QUICK_ICONS.map(({ id, Icon, iconColor, iconBg }, idx) => {
              let label = '';
              let desc = '';
              if (id === 'weather') { label = t.dashboard.actionWeather; desc = t.dashboard.actionWeatherDesc; }
              if (id === 'disease') { label = t.dashboard.actionDisease; desc = t.dashboard.actionDiseaseDesc; }
              if (id === 'calendar') { label = t.dashboard.actionCalendar; desc = t.dashboard.actionCalendarDesc; }
              if (id === 'yield') { label = t.dashboard.actionYield; desc = t.dashboard.actionYieldDesc; }
              
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (id === 'weather') onNavigate?.('weather');
                    else if (id === 'disease') onNavigate?.('disease');
                    else if (id === 'calendar') onNavigate?.('calendar');
                    else if (id === 'yield') onNavigate?.('yield');
                  }}
                  className="text-left p-5 rounded-2xl"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: cardShadow,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(61,74,31,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = cardShadow; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: iconBg }}
                  >
                    <Icon size={20} color={iconColor} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-sm tracking-tight" style={{ color: '#2B2B24' }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B6B5C' }}>{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Farming tip card ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(201,161,92,0.12) 0%, rgba(201,161,92,0.06) 100%)',
            boxShadow: '0 4px 20px rgba(201,161,92,0.12)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,161,92,0.20)' }}
            >
              <Lightbulb size={20} color="#C9A15C" strokeWidth={2} />
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#C9A15C' }}
              >
                Farming Tip
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#2B2B24' }}>
                Early morning irrigation (before 8 AM) reduces water loss by up to{' '}
                <span className="font-semibold">30%</span> during hot seasons.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
