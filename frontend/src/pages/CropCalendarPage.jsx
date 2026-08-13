import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wheat,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Sprout,
} from 'lucide-react';
import { getCropCalendar } from '../api';
import { useTranslation } from '../LanguageContext';

const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';
const heroShadow = '0 8px 40px rgba(61,74,31,0.18), 0 2px 10px rgba(61,74,31,0.10)';

export default function CropCalendarPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!farmerId) {
      setError('Farmer ID missing.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    getCropCalendar(farmerId)
      .then(data => {
        if (!isMounted) return;
        setCalendarData(data);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load crop calendar data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [farmerId]);

  const crop = calendarData?.crops?.[0];
  const cropType = crop?.crop_type || 'Crop';
  const plantingDate = crop?.planting_date || 'N/A';
  const daysSincePlanting = crop?.days_since_planting ?? 0;
  const stageInfo = crop?.stage_info || {};

  const status = stageInfo.status;
  const currentStageName = stageInfo.current_stage || (status === 'ready_for_harvest' ? t.cropCalendar.harvestMaturity : t.cropCalendar.scheduled);
  const stagesList = stageInfo.stages_list || [];

  // Stage progress fraction inside the current stage
  let stageProgressFraction = 0;
  if (stageInfo.stage_duration && stageInfo.days_in_stage !== undefined) {
    stageProgressFraction = Math.min(100, Math.max(0, Math.round((stageInfo.days_in_stage / stageInfo.stage_duration) * 100)));
  } else if (status === 'ready_for_harvest') {
    stageProgressFraction = 100;
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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.cropCalendar.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {t.cropCalendar.subtitle.replace('{crop}', cropType)}
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
              {t.cropCalendar.loading}
            </p>
            <p className="text-xs" style={{ color: '#6B6B5C' }}>
              {t.cropCalendar.loadingDesc}
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
              {t.cropCalendar.errorLoad}
            </h3>
            <p className="text-xs max-w-xs mx-auto" style={{ color: '#6B6B5C' }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full text-white font-semibold text-xs mt-2"
              style={{ background: '#3D4A1F', boxShadow: '0 4px 14px rgba(61,74,31,0.25)' }}
            >
              {t.cropCalendar.tryAgain}
            </button>
          </div>
        )}

        {/* ── Loaded Crop Calendar Content ── */}
        {!loading && !error && crop && (
          <>
            {/* ── Hero Stage Card ── */}
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
                    className="text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: '#C9A15C' }}
                  >
                    {t.cropCalendar.currentStage}
                  </p>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    {currentStageName}
                  </h2>
                  <p className="text-white/70 text-xs mt-1 font-medium">
                    {status === 'scheduled'
                      ? t.cropCalendar.plantingScheduled.replace('{days}', stageInfo.days_until_planting)
                      : status === 'ready_for_harvest'
                      ? t.cropCalendar.readyForHarvest.replace('{days}', stageInfo.days_past)
                      : t.cropCalendar.dayOfCycle.replace('{days}', daysSincePlanting).replace('{stageDays}', stageInfo.days_in_stage ?? 0)}
                  </p>
                </div>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,161,92,0.18)' }}
                >
                  <Sprout size={30} color="#C9A15C" strokeWidth={2} />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span style={{ color: '#C9A15C' }}>{t.cropCalendar.stageProgress}</span>
                  <span className="text-white">{stageProgressFraction}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stageProgressFraction}%`,
                      background: 'linear-gradient(90deg, #C9A15C 0%, #DDB97A 100%)',
                    }}
                  />
                </div>
              </div>

              {/* Summary Stats Row inside Hero Card */}
              <div
                className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
              >
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#C9A15C] font-semibold block">
                    {t.cropCalendar.plantingDate}
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block truncate">
                    {plantingDate}
                  </span>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-[#C9A15C] font-semibold block">
                    {t.cropCalendar.daysActive}
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">
                    {daysSincePlanting >= 0 ? t.cropCalendar.daysValue.replace('{days}', daysSincePlanting) : t.cropCalendar.scheduled}
                  </span>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-[#C9A15C] font-semibold block">
                    {t.cropCalendar.nextStage}
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block truncate">
                    {stageInfo.next_stage ? t.cropCalendar.daysAway.replace('{days}', stageInfo.days_to_next) : t.cropCalendar.harvest}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Growth Timeline / Stepper Section ── */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4 px-1"
                style={{ color: '#6B6B5C' }}
              >
                {t.cropCalendar.timelineTitle}
              </p>

              <div
                className="rounded-3xl p-6 relative"
                style={{ background: '#FFFFFF', boxShadow: cardShadow }}
              >
                <div className="space-y-6 relative">
                  {/* Vertical connecting line */}
                  <div
                    className="absolute left-4 top-4 bottom-4 w-0.5"
                    style={{ background: '#EDE8DC' }}
                  />

                  {stagesList.map(([sName, sStart, sEnd], idx) => {
                    const isCompleted = daysSincePlanting >= sEnd;
                    const isCurrent = daysSincePlanting >= sStart && (daysSincePlanting < sEnd || (idx === stagesList.length - 1 && daysSincePlanting === sEnd));

                    return (
                      <div key={idx} className="relative flex items-start gap-4 z-10">
                        {/* Stepper Node Icon */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isCompleted
                              ? '#3D4A1F'
                              : isCurrent
                              ? '#C9A15C'
                              : '#F7F3EA',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(201,161,92,0.25)' : 'none',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.5} />
                          ) : isCurrent ? (
                            <Clock size={18} color="#2B2B24" strokeWidth={2.5} />
                          ) : (
                            <Circle size={14} color="#6B6B5C" strokeWidth={2} />
                          )}
                        </div>

                        {/* Stage Details */}
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-sm font-bold tracking-tight ${
                                isCurrent ? 'text-[#3D4A1F] text-base' : 'text-[#2B2B24]'
                              }`}
                            >
                              {sName}
                            </h4>

                            <span
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{
                                background: isCompleted
                                  ? 'rgba(61,74,31,0.10)'
                                  : isCurrent
                                  ? 'rgba(201,161,92,0.20)'
                                  : '#F7F3EA',
                                color: isCompleted
                                  ? '#3D4A1F'
                                  : isCurrent
                                  ? '#8B6A26'
                                  : '#6B6B5C',
                              }}
                            >
                              {isCompleted ? t.cropCalendar.completed : isCurrent ? t.cropCalendar.activeStage : t.cropCalendar.upcoming}
                            </span>
                          </div>

                          <p className="text-xs font-medium mt-1 flex items-center gap-1.5" style={{ color: '#6B6B5C' }}>
                            <Calendar size={13} strokeWidth={2} />
                            <span>
                              {t.cropCalendar.durationText.replace('{start}', sStart).replace('{end}', sEnd).replace('{duration}', sEnd - sStart)}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
