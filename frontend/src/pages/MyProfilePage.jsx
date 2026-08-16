import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Phone, MapPin, Upload } from 'lucide-react';
import { getFarmer, uploadProfilePhoto, API_BASE } from '../api';
import { useTranslation } from '../LanguageContext';

const cardShadow = '0 4px 24px rgba(61,74,31,0.10), 0 1.5px 6px rgba(61,74,31,0.06)';

export default function MyProfilePage({ farmerId, onBack }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!farmerId) return;
    getFarmer(farmerId)
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [farmerId]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadProfilePhoto(farmerId, file);
      setProfile(prev => ({ ...prev, profile_photo: res.profile_photo }));
    } catch (err) {
      alert(err.message || t.profile.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EA]">
        <div className="text-[#3D4A1F] font-semibold">{t.profile.loading}</div>
      </div>
    );
  }

  if (!profile) return null;

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : '?';
  const photoUrl = profile.profile_photo ? `${API_BASE}/${profile.profile_photo}` : null;

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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.profile.title}</h1>
        </div>
      </div>

      <div className="px-5 pt-6">
        
        {/* Photo Section */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-28 h-28 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #C9A15C 0%, #a07c3a 100%)',
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-[#2B2B24] font-bold">{initial}</span>
            )}
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            className="hidden" 
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-full text-white"
            style={{
              background: '#3D4A1F',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <Upload size={16} />
            <span>{uploading ? t.profile.uploading : t.profile.changePhoto}</span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: '#FFFFFF', boxShadow: cardShadow }}>
            <div className="mt-1"><User size={20} color="#C9A15C" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B5C] mb-1">{t.profile.fullName}</p>
              <p className="text-[#2B2B24] font-semibold text-lg">{profile.name}</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: '#FFFFFF', boxShadow: cardShadow }}>
            <div className="mt-1"><Phone size={20} color="#C9A15C" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B5C] mb-1">{t.profile.phoneNumber}</p>
              <p className="text-[#2B2B24] font-semibold text-lg">{profile.phone}</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: '#FFFFFF', boxShadow: cardShadow }}>
            <div className="mt-1"><MapPin size={20} color="#C9A15C" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B5C] mb-1">{t.profile.location}</p>
              <p className="text-[#2B2B24] font-semibold text-lg">{profile.location}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
