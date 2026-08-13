import { useState, useRef } from 'react';
import {
  ArrowLeft,
  Wheat,
  Upload,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  FileImage,
  Info,
} from 'lucide-react';
import { detectDisease } from '../api';
import { useTranslation } from '../LanguageContext';

const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';
const heroShadow = '0 8px 40px rgba(61,74,31,0.18), 0 2px 10px rgba(61,74,31,0.10)';

function getDiseaseNameMap(t) {
  return {
    "Corn_(maize)___healthy": t.diseaseDetection.diseases.healthy,
    "Corn_(maize)___Common_rust_": t.diseaseDetection.diseases.commonRust,
    "Corn_(maize)___Northern_Leaf_Blight": t.diseaseDetection.diseases.northernLeafBlight,
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": t.diseaseDetection.diseases.grayLeafSpot,
  };
}

function formatDiseaseName(rawLabel, t) {
  if (!rawLabel) return t.diseaseDetection.diagnosisCompleted;
  const map = getDiseaseNameMap(t);
  if (map[rawLabel]) {
    return map[rawLabel].name;
  }

  // Fallback cleanup:
  // 1. Remove crop prefix like "Corn_(maize)___" or "Wheat___"
  let clean = rawLabel.replace(/^.+?___/, '');
  // 2. Replace underscores with spaces
  clean = clean.replace(/_/g, ' ');
  // 3. Remove extra spaces
  clean = clean.trim().replace(/\s+/g, ' ');

  // 4. Capitalize words
  return clean
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function DiseaseDetectionPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t.diseaseDetection.errorFile);
      return;
    }

    setError('');
    setResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleClearImage() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleAnalyze() {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await detectDisease(selectedFile, farmerId);
      setResult(data);
    } catch (err) {
      setError(err.message || t.diseaseDetection.errorAnalysis);
    } finally {
      setLoading(false);
    }
  }

  const rawClassName = result?.class_name || '';
  const isHealthy = rawClassName.toLowerCase().includes('healthy');
  const friendlyName = formatDiseaseName(rawClassName, t);
  const mappedInfo = getDiseaseNameMap(t)[rawClassName];
  const adviceText = mappedInfo?.advice || (
    isHealthy
      ? t.diseaseDetection.diseases.fallbackHealthy
      : t.diseaseDetection.diseases.fallbackDisease.replace('{name}', friendlyName)
  );

  // Format confidence percentage
  let confidencePct = null;
  if (result?.confidence !== undefined && result?.confidence !== null) {
    const confVal = typeof result.confidence === 'number' ? result.confidence : parseFloat(result.confidence);
    if (!isNaN(confVal)) {
      confidencePct = confVal <= 1.0 ? Math.round(confVal * 100) : Math.round(confVal);
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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.diseaseDetection.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {t.diseaseDetection.subtitle}
          </p>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="px-5 pt-6 space-y-5">

        {/* ── Upload Card / Drop Zone ── */}
        <div
          className="rounded-3xl p-6"
          style={{ background: '#FFFFFF', boxShadow: cardShadow }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {!previewUrl ? (
            /* Drop zone when no image selected */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 min-h-[160px] flex flex-col justify-center"
              style={{
                background: '#F7F3EA',
                borderColor: '#C9A15C',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EDE8DC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EA'; }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(201,161,92,0.20)' }}
              >
                <ImagePlus size={28} color="#3D4A1F" strokeWidth={2} />
              </div>

              <p className="font-bold text-base" style={{ color: '#2B2B24' }}>
                {t.diseaseDetection.tapToUpload}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6B6B5C' }}>
                {t.diseaseDetection.supports}
              </p>
            </div>
          ) : (
            /* Compact thumbnail chip — ChatGPT/Claude attached-image style */
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              <div
                className="relative flex-shrink-0 rounded-xl overflow-hidden"
                style={{ width: 88, height: 88, boxShadow: '0 2px 10px rgba(61,74,31,0.14)' }}
              >
                <img
                  src={previewUrl}
                  alt="Selected leaf sample"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={handleClearImage}
                  title="Remove image"
                  className="absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer z-10"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                  aria-label="Remove image"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Filename + Change photo */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#6B6B5C' }}>
                  <FileImage size={13} className="flex-shrink-0" />
                  <span className="truncate">{selectedFile?.name}</span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold py-2"
                  style={{ color: '#3D4A1F' }}
                >
                  {t.diseaseDetection.changePhoto}
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium mt-4"
              style={{ background: '#FFF1F1', color: '#C0392B' }}
            >
              <AlertCircle size={16} strokeWidth={2.5} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="w-full py-4 rounded-full text-white font-semibold text-base mt-5 flex items-center justify-center gap-2"
            style={{
              background: !selectedFile || loading ? '#A3B18A' : 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 100%)',
              boxShadow: !selectedFile || loading ? 'none' : '0 6px 20px rgba(61,74,31,0.35)',
              cursor: !selectedFile || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{t.diseaseDetection.analyzing}</span>
              </>
            ) : (
              <>
                <Upload size={18} strokeWidth={2.5} />
                <span>{t.diseaseDetection.analyzeBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* ── Results Section ── */}
        {result && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: isHealthy
                  ? 'linear-gradient(135deg, #3D4A1F 0%, #4A5A26 60%, #5C6E30 100%)'
                  : 'linear-gradient(135deg, #2B2B24 0%, #3D4A1F 100%)',
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
                    {t.diseaseDetection.diagnosisTitle}
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-white">
                    {friendlyName}
                  </h3>
                  {confidencePct !== null && (
                    <p className="text-white/80 text-sm font-medium mt-1">
                      {t.diseaseDetection.confidence} <span className="font-bold text-[#C9A15C]">{confidencePct}%</span>
                    </p>
                  )}
                </div>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isHealthy ? 'rgba(201,161,92,0.20)' : 'rgba(239,68,68,0.20)',
                  }}
                >
                  {isHealthy ? (
                    <CheckCircle2 size={30} color="#C9A15C" strokeWidth={2} />
                  ) : (
                    <AlertTriangle size={30} color="#EF4444" strokeWidth={2} />
                  )}
                </div>
              </div>

              {/* Status Message */}
              <div
                className="mt-5 pt-4 rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  {adviceText}
                </p>
              </div>
            </div>

            {/* Disclaimer Card */}
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: 'rgba(201,161,92,0.12)',
                boxShadow: '0 2px 10px rgba(61,74,31,0.05)',
                border: '1px solid rgba(201,161,92,0.30)',
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,161,92,0.20)' }}
              >
                <Info size={18} color="#C9A15C" strokeWidth={2} />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: '#C9A15C' }}
                >
                  {t.diseaseDetection.noteAccuracy}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#2B2B24' }}>
                  {t.diseaseDetection.noteDesc}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
