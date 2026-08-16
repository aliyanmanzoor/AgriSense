import { useState, useEffect } from 'react'
import './index.css'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import WeatherPage from './pages/WeatherPage'
import CropCalendarPage from './pages/CropCalendarPage'
import DiseaseDetectionPage from './pages/DiseaseDetectionPage'
import YieldPredictionPage from './pages/YieldPredictionPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import MyProfilePage from './pages/MyProfilePage'
import PlaceholderPage from './pages/PlaceholderPage'
import AboutPage from './pages/AboutPage'
import HelpSupportPage from './pages/HelpSupportPage'
import MyFarmPage from './pages/MyFarmPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import LanguagePage from './pages/LanguagePage'
import DeleteAccountPage from './pages/DeleteAccountPage'
import NotificationPreferencesPage from './pages/NotificationPreferencesPage'

// Simple screen-based router with History API integration.
// Screens: 'login' | 'onboarding' | 'dashboard' | 'weather' | 'calendar' |
//          'disease' | 'yield' | 'alerts' | 'settings' | 'profile' | 'about' |
//          'support' | 'farm' | 'password' | 'language' | 'delete' | 'notifications'
export default function App() {
  const [screen, setScreen] = useState('login')
  const [session, setSession] = useState({ farmerId: null, farmerName: null })

  // ── History API integration ──────────────────────────────────────────────
  // Seed the very first history entry so there is always something to pop to.
  useEffect(() => {
    window.history.replaceState({ screen: 'login' }, '')

    function handlePopState(event) {
      // event.state is null when the user backs all the way out of our history;
      // in that case fall back to 'login' rather than crashing.
      const target = event.state?.screen ?? 'login'
      setScreen(target)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // run once on mount

  /** Navigate to a screen, recording a browser history entry. */
  function navigate(nextScreen) {
    window.history.pushState({ screen: nextScreen }, '')
    setScreen(nextScreen)
  }
  // ────────────────────────────────────────────────────────────────────────

  function handleLogin(farmerId, farmerName) {
    setSession({ farmerId, farmerName })
    navigate('dashboard')
  }

  function handleLogout() {
    setSession({ farmerId: null, farmerName: null })
    // Replace rather than push so the user can't "forward" back into the app
    // after logging out.
    window.history.replaceState({ screen: 'login' }, '')
    setScreen('login')
  }

  function handleRegisterSuccess() {
    // After successful registration, redirect to login so they can sign in.
    navigate('login')
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingPage
        onSuccess={handleRegisterSuccess}
        onLogin={() => navigate('login')}
      />
    )
  }

  if (screen === 'dashboard') {
    return (
      <DashboardPage
        farmerName={session.farmerName}
        farmerId={session.farmerId}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    )
  }

  if (screen === 'weather') {
    return (
      <WeatherPage
        farmerId={session.farmerId}
        onBack={() => navigate('dashboard')}
      />
    )
  }

  if (screen === 'calendar') {
    return (
      <CropCalendarPage
        farmerId={session.farmerId}
        onBack={() => navigate('dashboard')}
      />
    )
  }

  if (screen === 'disease') {
    return (
      <DiseaseDetectionPage
        farmerId={session.farmerId}
        onBack={() => navigate('dashboard')}
      />
    )
  }

  if (screen === 'yield') {
    return (
      <YieldPredictionPage
        farmerId={session.farmerId}
        onBack={() => navigate('dashboard')}
      />
    )
  }

  if (screen === 'alerts') {
    return (
      <NotificationsPage
        farmerId={session.farmerId}
        onBack={() => navigate('dashboard')}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsPage
        onBack={() => navigate('dashboard')}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (screen === 'profile') return <MyProfilePage farmerId={session.farmerId} onBack={() => navigate('settings')} />;
  if (screen === 'about') return <AboutPage onBack={() => navigate('settings')} />;
  if (screen === 'support') return <HelpSupportPage onBack={() => navigate('settings')} />;
  if (screen === 'farm') return <MyFarmPage farmerId={session.farmerId} onBack={() => navigate('settings')} />;
  if (screen === 'password') return <ChangePasswordPage farmerId={session.farmerId} onBack={() => navigate('settings')} />;

  if (screen === 'language') {
    return (
      <LanguagePage
        onBack={() => navigate('settings')}
      />
    )
  }

  if (screen === 'delete') {
    return (
      <DeleteAccountPage
        farmerId={session.farmerId}
        onBack={() => navigate('settings')}
        onDeactivated={handleLogout}
      />
    )
  }

  if (screen === 'notifications') {
    return (
      <NotificationPreferencesPage
        farmerId={session.farmerId}
        onBack={() => navigate('settings')}
      />
    )
  }

  // Default: login
  return (
    <LoginPage
      onLogin={handleLogin}
      onSignUp={() => navigate('onboarding')}
    />
  )
}
