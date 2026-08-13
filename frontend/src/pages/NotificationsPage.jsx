import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wheat,
  AlertTriangle,
  Info,
  CheckCircle,
  Bell,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { getNotifications } from '../api';
import { useTranslation } from '../LanguageContext';

const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';

function getRelativeTime(sentAtStr, t) {
  if (!sentAtStr) return '';
  try {
    // sqlite datetimes are saved in UTC, so append Z to parse as UTC
    const sentAt = new Date(sentAtStr.includes('Z') ? sentAtStr : sentAtStr + 'Z');
    const now = new Date();
    const diffMs = now - sentAt;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t.notifications.justNow;
    if (diffMins < 60) return t.notifications.minsAgo.replace('{mins}', diffMins);
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t.notifications.hoursAgo.replace('{hours}', diffHours);
    const diffDays = Math.floor(diffHours / 24);
    return t.notifications.daysAgo.replace('{days}', diffDays);
  } catch {
    return sentAtStr;
  }
}

export default function NotificationsPage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!farmerId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    getNotifications(farmerId)
      .then(data => {
        if (!isMounted) return;
        setNotifications(data.notifications || []);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || t.notifications.errorLoad);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [farmerId]);

  function getNotifConfig(type) {
    const t = String(type).toLowerCase();
    if (t === 'warning' || t === 'error' || t === 'alert') {
      return { Icon: AlertTriangle, iconColor: '#DC2626', bg: 'rgba(239,68,68,0.12)' };
    }
    if (t === 'success' || t === 'confirm') {
      return { Icon: CheckCircle, iconColor: '#3D4A1F', bg: 'rgba(61,74,31,0.12)' };
    }
    return { Icon: Info, iconColor: '#C9A15C', bg: 'rgba(201,161,92,0.18)' };
  }

  const alertCount = notifications.length;
  const alertNoun = alertCount === 1 ? t.notifications.alertNounSingle : t.notifications.alertNounPlural;

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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.notifications.title}</h1>
          <p className="text-white/60 text-xs mt-0.5 font-medium tracking-wide uppercase">
            {alertCount === 0 ? t.notifications.noAlertsActive : t.notifications.alertsActive.replace('{count}', alertCount).replace('{noun}', alertNoun)}
          </p>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="px-5 pt-6 space-y-4">

        {/* Loading State */}
        {loading && (
          <div
            className="rounded-3xl p-10 text-center space-y-3"
            style={{ background: '#FFFFFF', boxShadow: cardShadow }}
          >
            <RefreshCw size={28} color="#3D4A1F" className="animate-spin mx-auto" />
            <p className="text-sm font-semibold" style={{ color: '#2B2B24' }}>
              {t.notifications.loading}
            </p>
          </div>
        )}

        {/* Error State */}
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
              {t.notifications.errorLoad}
            </h3>
            <p className="text-xs" style={{ color: '#6B6B5C' }}>
              {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && alertCount === 0 && (
          <div
            className="rounded-3xl p-8 text-center space-y-4"
            style={{ background: '#FFFFFF', boxShadow: cardShadow }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(201,161,92,0.15)' }}
            >
              <Bell size={26} color="#C9A15C" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg" style={{ color: '#2B2B24' }}>
                {t.notifications.noNotifsYet}
              </h3>
              <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: '#6B6B5C' }}>
                {t.notifications.noNotifsDesc}
              </p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && alertCount > 0 && (
          <div className="space-y-3">
            {notifications.map(notif => {
              const config = getNotifConfig(notif.type);
              const Icon = config.Icon;
              return (
                <div
                  key={notif.id}
                  className="rounded-2xl p-5 flex items-start gap-4"
                  style={{ background: '#FFFFFF', boxShadow: cardShadow }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: config.bg }}
                  >
                    <Icon size={20} color={config.iconColor} strokeWidth={2} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-relaxed" style={{ color: '#2B2B24' }}>
                      {notif.message}
                    </p>
                    <p className="text-xxs font-semibold" style={{ color: '#6B6B5C' }}>
                      {getRelativeTime(notif.sent_at, t)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
