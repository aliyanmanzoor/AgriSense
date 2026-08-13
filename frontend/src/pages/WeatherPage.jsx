import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  AlertCircle,
  Wheat,
  RefreshCw,
} from 'lucide-react';
import { getWeather, getFarmer } from '../api';
import { useTranslation } from '../LanguageContext';

const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';
const heroShadow = '0 8px 40px rgba(61,74,31,0.18), 0 2px 10px rgba(61,74,31,0.10)';

export default function WeatherPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [farmerLocation, setFarmerLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define WEATHER_CODE_MAP inside component to access t
  const WEATHER_CODE_MAP = {
    0: { label: t.weather.codes[0], Icon: Sun, color: '#EAB308' },
    1: { label: t.weather.codes[1], Icon: CloudSun, color: '#F59E0B' },
    2: { label: t.weather.codes[2], Icon: CloudSun, color: '#F59E0B' },
    3: { label: t.weather.codes[3], Icon: Cloud, color: '#6B7280' },
    45: { label: t.weather.codes[45], Icon: CloudFog, color: '#9CA3AF' },
    48: { label: t.weather.codes[48], Icon: CloudFog, color: '#9CA3AF' },
    51: { label: t.weather.codes[51], Icon: CloudDrizzle, color: '#3B82F6' },
    53: { label: t.weather.codes[53], Icon: CloudDrizzle, color: '#3B82F6' },
    55: { label: t.weather.codes[55], Icon: CloudRain, color: '#2563EB' },
    61: { label: t.weather.codes[61], Icon: CloudRain, color: '#2563EB' },
    63: { label: t.weather.codes[63], Icon: CloudRain, color: '#1D4ED8' },
    65: { label: t.weather.codes[65], Icon: CloudRain, color: '#1E40AF' },
    71: { label: t.weather.codes[71], Icon: Snowflake, color: '#60A5FA' },
    73: { label: t.weather.codes[73], Icon: Snowflake, color: '#3B82F6' },
    75: { label: t.weather.codes[75], Icon: Snowflake, color: '#1D4ED8' },
    77: { label: t.weather.codes[77], Icon: Snowflake, color: '#60A5FA' },
    80: { label: t.weather.codes[80], Icon: CloudRain, color: '#2563EB' },
    81: { label: t.weather.codes[81], Icon: CloudRain, color: '#1D4ED8' },
    82: { label: t.weather.codes[82], Icon: CloudLightning, color: '#7C3AED' },
    85: { label: t.weather.codes[85], Icon: Snowflake, color: '#3B82F6' },
    86: { label: t.weather.codes[86], Icon: Snowflake, color: '#1D4ED8' },
    95: { label: t.weather.codes[95], Icon: CloudLightning, color: '#7C3AED' },
    96: { label: t.weather.codes[96], Icon: CloudLightning, color: '#6D28D9' },
    99: { label: t.weather.codes[99], Icon: CloudLightning, color: '#5B21B6' },
  };

  function getWeatherInfo(code) {
    return WEATHER_CODE_MAP[code] || { label: t.weather.unknown, Icon: Cloud, color: '#6B7280' };
  }

  function formatDayLabel(dateStr, idx) {
    if (idx === 0) return t.weather.today;
    if (idx === 1) return t.weather.tomorrow;
    try {
      const dt = new Date(dateStr);
      // For Urdu, you might ideally use 'ur-PK' but keeping logic simple for now
      return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  useEffect(() => {
    if (!farmerId) {
      setError('Farmer ID missing.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    // Fetch farmer profile for location name + weather endpoint
    Promise.all([
      getFarmer(farmerId).catch(() => null),
      getWeather(farmerId),
    ])
      .then(([farmer, weather]) => {
        if (!isMounted) return;
        if (farmer?.location) {
          setFarmerLocation(farmer.location);
        }
        setWeatherData(weather);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load weather data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [farmerId]);

  const currentCw = weatherData?.current_weather || {};
  const daily = weatherData?.daily_forecast || {};
  const warnings = weatherData?.warnings || [];

  const currentTemp = currentCw.temperature;
  const currentCode = currentCw.weathercode ?? 0;
  const currentWind = currentCw.windspeed ?? 0;
  const weatherInfo = getWeatherInfo(currentCode);
  const CurrentIcon = weatherInfo.Icon;

  const dates = daily.time || [];
  const tmaxList = daily.temperature_2m_max || [];
  const tminList = daily.temperature_2m_min || [];
  const precipProbList = daily.precipitation_probability_max || [];
  const codesList = daily.weathercode || [];

  const todayMax = tmaxList[0];
  const todayMin = tminList[0];
  const todayPrecipProb = precipProbList[0] ?? 0;

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
        <div className="flex items-center justify-between px-5 pt-5">
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

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)',
                boxShadow: '0 3px 10px rgba(201,161,92,0.35)',
              }}
            >
              <Wheat size={16} color="#2B2B24" strokeWidth={2} />
            </div>
            <span className="text-white font-bold text-base tracking-tight">AgriSense</span>
          </div>
        </div>

        <div className="px-5 pt-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.weather.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {farmerLocation ? `${t.weather.subtitleLocation} ${farmerLocation}` : t.weather.subtitleLocal}
          </p>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="px-5 pt-6 space-y-5">

        {/* ── Loading State ── */}
        {loading && (
          <div
            className="rounded-3xl p-10 text-center space-y-3"
            style={{ background: '#FFFFFF', boxShadow: cardShadow }}
          >
            <RefreshCw size={28} color="#3D4A1F" className="animate-spin mx-auto" />
            <p className="text-sm font-semibold" style={{ color: '#2B2B24' }}>
              {t.weather.fetching}
            </p>
            <p className="text-xs" style={{ color: '#6B6B5C' }}>
              {t.weather.fetchingDesc}
            </p>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div
            className="rounded-3xl p-6 text-center space-y-3"
            style={{ background: '#FFFFFF', boxShadow: cardShadow }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: '#FFF1F1' }}
            >
              <AlertCircle size={24} color="#C0392B" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-base" style={{ color: '#2B2B24' }}>
              {t.weather.errorLoad}
            </h3>
            <p className="text-xs max-w-xs mx-auto" style={{ color: '#6B6B5C' }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full text-white font-semibold text-xs mt-2"
              style={{ background: '#3D4A1F', boxShadow: '0 4px 14px rgba(61,74,31,0.25)' }}
            >
              {t.weather.tryAgain}
            </button>
          </div>
        )}

        {/* ── Loaded Weather Content ── */}
        {!loading && !error && weatherData && (
          <>
            {/* ── Weather Warnings Alert Card (Top if exists) ── */}
            {warnings.length > 0 && (
              <div className="space-y-3">
                {warnings.map((w, idx) => {
                  const isError = w.level === 'error';
                  const bg = isError
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(201,161,92,0.16) 0%, rgba(201,161,92,0.08) 100%)';
                  const iconBg = isError ? 'rgba(239,68,68,0.20)' : 'rgba(201,161,92,0.25)';
                  const iconColor = isError ? '#DC2626' : '#C9A15C';
                  const labelColor = isError ? '#DC2626' : '#C9A15C';

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl p-5"
                      style={{
                        background: bg,
                        boxShadow: '0 4px 20px rgba(61,74,31,0.08)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: iconBg }}
                        >
                          <AlertTriangle size={20} color={iconColor} strokeWidth={2} />
                        </div>
                        <div>
                          <p
                            className="text-xs font-semibold uppercase tracking-widest mb-1"
                            style={{ color: labelColor }}
                          >
                            {isError ? t.weather.alert : t.weather.advisory}
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: '#2B2B24' }}>
                            {w.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Hero Weather Card ── */}
            <div
              className="rounded-3xl p-6 text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 60%, #5C6E30 100%)',
                boxShadow: heroShadow,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: '#C9A15C' }}
                  >
                    {t.weather.currentConditions}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-white/90">
                    {farmerLocation || t.weather.localFarm}
                  </h2>
                  <p className="text-3xl font-extrabold mt-3 tracking-tight">
                    {currentTemp !== undefined ? `${Math.round(currentTemp)}°C` : '—'}
                  </p>
                  <p className="text-sm font-medium text-white/80 mt-1">
                    {weatherInfo.label}
                  </p>
                </div>

                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(201,161,92,0.18)' }}
                >
                  <CurrentIcon size={36} color="#C9A15C" strokeWidth={2} />
                </div>
              </div>

              {/* High / Low Summary Row inside Hero */}
              {todayMax !== undefined && todayMin !== undefined && (
                <div
                  className="flex items-center justify-around sm:justify-start gap-4 sm:gap-6 mt-5 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#C9A15C] font-semibold block">
                      {t.weather.highLow}
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {Math.round(todayMax)}°C / {Math.round(todayMin)}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#C9A15C] font-semibold block">
                      {t.weather.rainChance}
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {Math.round(todayPrecipProb)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Row of Stat Cards ── */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
                style={{ color: '#6B6B5C' }}
              >
                {t.weather.todaysOverview}
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Precip / Rain */}
                <div
                  className="p-3 sm:p-4 rounded-2xl"
                  style={{ background: '#FFFFFF', boxShadow: cardShadow }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: 'rgba(59,130,246,0.15)' }}
                  >
                    <Droplets size={18} color="#3B82F6" strokeWidth={2} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6B5C' }}>
                    {t.weather.rain}
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#2B2B24' }}>
                    {Math.round(todayPrecipProb)}%
                  </p>
                </div>

                {/* Wind */}
                <div
                  className="p-3 sm:p-4 rounded-2xl"
                  style={{ background: '#FFFFFF', boxShadow: cardShadow }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: 'rgba(61,74,31,0.12)' }}
                  >
                    <Wind size={18} color="#3D4A1F" strokeWidth={2} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6B5C' }}>
                    {t.weather.wind}
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#2B2B24' }}>
                    {Math.round(currentWind)} <span className="text-xs font-normal">{t.weather.kmh}</span>
                  </p>
                </div>

                {/* Temp Range */}
                <div
                  className="p-3 sm:p-4 rounded-2xl"
                  style={{ background: '#FFFFFF', boxShadow: cardShadow }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: 'rgba(201,161,92,0.18)' }}
                  >
                    <Thermometer size={18} color="#C9A15C" strokeWidth={2} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6B5C' }}>
                    {t.weather.highLow}
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#2B2B24' }}>
                    {todayMax !== undefined ? `${Math.round(todayMax)}° / ${Math.round(todayMin)}°` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Horizontally Scrollable 5-Day Forecast ── */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
                style={{ color: '#6B6B5C' }}
              >
                {t.weather.forecast5Day}
              </p>

              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {dates.map((dateStr, idx) => {
                  const code = codesList[idx] ?? 0;
                  const dayInfo = getWeatherInfo(code);
                  const DayIcon = dayInfo.Icon;
                  const tMax = tmaxList[idx];
                  const tMin = tminList[idx];
                  const rainP = precipProbList[idx] ?? 0;

                  return (
                    <div
                      key={dateStr || idx}
                      className="p-4 rounded-2xl flex-shrink-0 w-32 text-center"
                      style={{
                        background: idx === 0 ? '#3D4A1F' : '#FFFFFF',
                        color: idx === 0 ? '#FFFFFF' : '#2B2B24',
                        boxShadow: cardShadow,
                      }}
                    >
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: idx === 0 ? '#C9A15C' : '#6B6B5C' }}
                      >
                        {formatDayLabel(dateStr, idx)}
                      </p>

                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2"
                        style={{
                          background: idx === 0 ? 'rgba(201,161,92,0.20)' : 'rgba(61,74,31,0.08)',
                        }}
                      >
                        <DayIcon
                          size={22}
                          color={idx === 0 ? '#C9A15C' : dayInfo.color}
                          strokeWidth={2}
                        />
                      </div>

                      <p className="text-xs font-semibold mb-1 truncate" style={{ opacity: 0.9 }}>
                        {dayInfo.label}
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {tMax !== undefined ? `${Math.round(tMax)}°` : '—'}{' '}
                        <span
                          className="text-xs font-normal"
                          style={{ opacity: idx === 0 ? 0.7 : 0.6 }}
                        >
                          / {tMin !== undefined ? `${Math.round(tMin)}°` : '—'}
                        </span>
                      </p>

                      <div
                        className="flex items-center justify-center gap-1 mt-2 text-xs font-medium"
                        style={{ color: idx === 0 ? '#C9A15C' : '#3B82F6' }}
                      >
                        <Droplets size={12} strokeWidth={2.5} />
                        <span>{Math.round(rainP)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
