import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Map, Sprout, Calendar, RefreshCw } from 'lucide-react';
import { useTranslation } from '../LanguageContext';
import { API_BASE } from '../api';


const inputStyle = {
  width: '100%',
  padding: '12px 16px 12px 40px',
  borderRadius: '16px',
  border: 'none',
  background: '#F7F3EA',
  color: '#2B2B24',
  fontSize: '16px',
  fontWeight: '500',
  outline: 'none',
  transition: 'box-shadow 0.2s ease',
};

export default function MyFarmPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [cropType, setCropType] = useState('Wheat');
  const [plantingDate, setPlantingDate] = useState('');
  const [farmSize, setFarmSize] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchFarm() {
      try {
        const response = await fetch(`${API_BASE}/crop-calendar/${farmerId}`);
        if (!response.ok) throw new Error('Failed to fetch farm data');
        const data = await response.json();
        
        if (!isMounted) return;
        if (data.crops && data.crops.length > 0) {
          const crop = data.crops[0];
          setCropType(crop.crop_type || 'Wheat');
          setPlantingDate(crop.planting_date || '');
          setFarmSize(crop.farm_size || '');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchFarm();
    return () => { isMounted = false; };
  }, [farmerId]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/farmer/${farmerId}/crop`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_type: cropType,
          planting_date: plantingDate,
          farm_size: parseFloat(farmSize) || 0
        })
      });
      if (!response.ok) {
        throw new Error('Update failed');
      }
      setSuccess(t.myFarm.success);
    } catch (err) {
      setError(err.message || t.myFarm.error);
    } finally {
      setSaving(false);
    }
  };

  const onFocus = (e) => { e.target.style.boxShadow = '0 0 0 2px #3D4A1F inset'; };
  const onBlur = (e) => { e.target.style.boxShadow = 'none'; };

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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.myFarm.title}</h1>
        </div>
      </div>

      <div className="px-5 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#3D4A1F]">
            <RefreshCw size={28} className="animate-spin mb-3" />
            <p className="font-semibold">{t.myFarm.loading}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 space-y-5" style={{ boxShadow: '0 4px 24px rgba(61,74,31,0.10)' }}>
            {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
            {success && <div className="text-green-600 text-sm font-semibold">{success}</div>}
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#3D4A1F]">
                {t.myFarm.cropType}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C]">
                  <Sprout size={18} />
                </div>
                <select
                  value={cropType}
                  onChange={e => setCropType(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#3D4A1F]">
                {t.myFarm.plantingDate}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C]">
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={e => setPlantingDate(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#3D4A1F]">
                {t.myFarm.farmSize}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B5C]">
                  <Map size={18} />
                </div>
                <input
                  type="number"
                  step="any"
                  value={farmSize}
                  onChange={e => setFarmSize(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{ background: '#3D4A1F' }}
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{saving ? t.myFarm.saving : t.myFarm.saveBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
