import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wheat,
  Droplet,
  FlaskConical,
  Thermometer,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Info,
} from 'lucide-react';
import { getFarmer, predictYield } from '../api';
import { useTranslation } from '../LanguageContext';

const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';
const heroShadow = '0 8px 40px rgba(61,74,31,0.18), 0 2px 10px rgba(61,74,31,0.10)';

export default function YieldPredictionPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [cropType, setCropType] = useState('Wheat');
  const [rainfall, setRainfall] = useState('');
  const [pesticides, setPesticides] = useState('');
  const [temp, setTemp] = useState('');
  
  const [loadingFarmer, setLoadingFarmer] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!farmerId) {
      setLoadingFarmer(false);
      return;
    }

    getFarmer(farmerId)
      .then(() => {
        // Fallback crop calendar call like in DashboardPage.jsx to fetch registered crop type
        return fetch(`http://localhost:8000/crop-calendar/${farmerId}`)
          .then(r => r.json())
          .then(cal => {
            const first = cal?.crops?.[0];
            if (first?.crop_type) {
              setCropType(first.crop_type);
            }
          });
      })
      .catch(() => {
        // Silent fallback to Wheat
      })
      .finally(() => {
        setLoadingFarmer(false);
      });
  }, [farmerId]);

  async function handlePredict(e) {
    e.preventDefault();
    if (!rainfall || !pesticides || !temp) {
      setError(t.yieldPrediction.errorEmpty);
      return;
    }
    
    const rainVal = parseFloat(rainfall);
    const pestVal = parseFloat(pesticides);
    const tempVal = parseFloat(temp);

    if (isNaN(rainVal) || isNaN(pestVal) || isNaN(tempVal)) {
      setError(t.yieldPrediction.errorNumeric);
      return;
    }

    setPredicting(true);
    setError('');
    setResult(null);

    try {
      const res = await predictYield({
        crop_type: cropType,
        rainfall: rainVal,
        pesticides: pestVal,
        avg_temp: tempVal,
      });
      setResult(res.yield_kg_ha);
    } catch (err) {
      setError(err.message || t.yieldPrediction.errorPrediction);
    } finally {
      setPredicting(false);
    }
  }

  const inputStyle = {
    background: '#F7F3EA',
    color: '#2B2B24',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(61,74,31,0.08)',
    border: 'none',
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: '16px',
    fontSize: '16px',
    transition: 'box-shadow 0.18s ease',
  };

  const onFocus = e => { e.target.style.boxShadow = '0 0 0 2.5px #3D4A1F, 0 2px 8px rgba(61,74,31,0.08)'; };
  const onBlur  = e => { e.target.style.boxShadow = '0 2px 8px rgba(61,74,31,0.08)'; };

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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.yieldPrediction.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {t.yieldPrediction.subtitle}
          </p>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="px-5 pt-6 space-y-5">

        {loadingFarmer ? (
          <div
            className="rounded-3xl p-10 text-center space-y-3"
            style={{ background: '#FFFFFF', boxShadow: cardShadow }}
          >
            <RefreshCw size={28} color="#3D4A1F" className="animate-spin mx-auto" />
            <p className="text-sm font-semibold" style={{ color: '#2B2B24' }}>
              {t.yieldPrediction.loading}
            </p>
          </div>
        ) : (
          <form onSubmit={handlePredict} className="space-y-5">
            {/* Input Card */}
            <div
              className="rounded-3xl p-6 space-y-5"
              style={{ background: '#FFFFFF', boxShadow: cardShadow }}
            >
              {/* Read-only Crop type */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B6B5C' }}>
                  {t.yieldPrediction.registeredCrop}
                </span>
                <div
                  className="px-4 py-3 rounded-2xl font-bold text-sm inline-flex items-center gap-2"
                  style={{ background: 'rgba(201,161,92,0.15)', color: '#3D4A1F' }}
                >
                  <Wheat size={16} strokeWidth={2.5} />
                  {cropType}
                </div>
              </div>

              {/* Rainfall */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#3D4A1F' }}>
                  {t.yieldPrediction.expectedRainfall}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C]">
                    <Droplet size={18} />
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={rainfall}
                    onChange={e => setRainfall(e.target.value)}
                    placeholder={t.yieldPrediction.rainfallPlaceholder}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    required
                  />
                </div>
              </div>

              {/* Pesticides */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#3D4A1F' }}>
                  {t.yieldPrediction.pesticideUse}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C]">
                    <FlaskConical size={18} />
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={pesticides}
                    onChange={e => setPesticides(e.target.value)}
                    placeholder={t.yieldPrediction.pesticidePlaceholder}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    required
                  />
                </div>
              </div>

              {/* Avg Temperature */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#3D4A1F' }}>
                  {t.yieldPrediction.avgTemp}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C]">
                    <Thermometer size={18} />
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={temp}
                    onChange={e => setTemp(e.target.value)}
                    placeholder={t.yieldPrediction.tempPlaceholder}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
                  style={{ background: '#FFF1F1', color: '#C0392B' }}
                >
                  <AlertCircle size={16} strokeWidth={2.5} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={predicting}
                className="w-full py-4 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2"
                style={{
                  background: predicting ? '#A3B18A' : 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 100%)',
                  boxShadow: predicting ? 'none' : '0 6px 20px rgba(61,74,31,0.35)',
                  cursor: predicting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {predicting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{t.yieldPrediction.predicting}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} strokeWidth={2.5} />
                    <span>{t.yieldPrediction.predictBtn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Results Section ── */}
        {result !== null && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 60%, #5C6E30 100%)',
                boxShadow: heroShadow,
                color: '#FFFFFF',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: '#C9A15C' }}
                  >
                    {t.yieldPrediction.estimatedYield}
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">
                    {Math.round(result).toLocaleString()} <span className="text-base font-normal text-white/80">{t.yieldPrediction.kgPerHectare}</span>
                  </h3>
                </div>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,161,92,0.20)' }}
                >
                  <TrendingUp size={30} color="#C9A15C" strokeWidth={2} />
                </div>
              </div>

              <div
                className="mt-5 pt-4 rounded-2xl p-4 flex items-start gap-2.5"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Info size={16} className="text-[#C9A15C] flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-white/90 leading-relaxed">
                  {t.yieldPrediction.disclaimer}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
