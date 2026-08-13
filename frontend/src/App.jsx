import { useState } from 'react'
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

// Simple screen-based router: 'login' | 'onboarding' | 'dashboard' | 'weather' | 'calendar' | 'disease' | 'yield' | 'alerts'
export default function App() {
  const [screen, setScreen] = useState('login')
  const [session, setSession] = useState({ farmerId: null, farmerName: null })

  function handleLogin(farmerId, farmerName) {
    setSession({ farmerId, farmerName })
    setScreen('dashboard')
  }

  function handleLogout() {
    setSession({ farmerId: null, farmerName: null })
    setScreen('login')
  }

  function handleRegisterSuccess() {
    // After successful registration, redirect to login so they can sign in
    setScreen('login')
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingPage
        onSuccess={handleRegisterSuccess}
        onLogin={() => setScreen('login')}
      />
    )
  }

  if (screen === 'dashboard') {
    return (
      <DashboardPage
        farmerName={session.farmerName}
        farmerId={session.farmerId}
        onLogout={handleLogout}
        onNavigate={setScreen}
      />
    )
  }

  if (screen === 'weather') {
    return (
      <WeatherPage
        farmerId={session.farmerId}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'calendar') {
    return (
      <CropCalendarPage
        farmerId={session.farmerId}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'disease') {
    return (
      <DiseaseDetectionPage
        farmerId={session.farmerId}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'yield') {
    return (
      <YieldPredictionPage
        farmerId={session.farmerId}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'alerts') {
    return (
      <NotificationsPage
        farmerId={session.farmerId}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsPage
        onBack={() => setScreen('dashboard')}
        onNavigate={setScreen}
        onLogout={handleLogout}
      />
    )
  }

  if (screen === 'profile') return <MyProfilePage farmerId={session.farmerId} onBack={() => setScreen('settings')} />;
  if (screen === 'about') return <AboutPage onBack={() => setScreen('settings')} />;
  if (screen === 'support') return <HelpSupportPage onBack={() => setScreen('settings')} />;
  if (screen === 'farm') return <MyFarmPage farmerId={session.farmerId} onBack={() => setScreen('settings')} />;
  if (screen === 'password') return <ChangePasswordPage farmerId={session.farmerId} onBack={() => setScreen('settings')} />;

  if (screen === 'language') {
    return (
      <LanguagePage
        onBack={() => setScreen('settings')}
      />
    )
  }

  if (screen === 'delete') {
    return (
      <DeleteAccountPage
        farmerId={session.farmerId}
        onBack={() => setScreen('settings')}
        onDeactivated={handleLogout}
      />
    )
  }

  if (screen === 'notifications') {
    return (
      <NotificationPreferencesPage
        farmerId={session.farmerId}
        onBack={() => setScreen('settings')}
      />
    )
  }

  // Default: login
  return (
    <LoginPage
      onLogin={handleLogin}
      onSignUp={() => setScreen('onboarding')}
    />
  )
}
