export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function login(phone, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  if (res.status === 401) throw new Error('Invalid phone number or password.');
  if (res.status === 403) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'This account has been deactivated.');
  }
  if (!res.ok) throw new Error('Login failed. Please try again.');
  return res.json();
}

export async function register(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed. Please try again.');
  }
  return res.json();
}

export async function getFarmer(farmerId) {
  const res = await fetch(`${API_BASE}/farmer/${farmerId}`);
  if (!res.ok) throw new Error('Could not fetch farmer data.');
  return res.json();
}

export async function getWeather(farmerId) {
  const res = await fetch(`${API_BASE}/weather/${farmerId}`);
  if (!res.ok) throw new Error('Could not fetch weather data.');
  return res.json();
}

export async function getCropCalendar(farmerId) {
  const res = await fetch(`${API_BASE}/crop-calendar/${farmerId}`);
  if (!res.ok) throw new Error('Could not fetch crop calendar data.');
  return res.json();
}

export async function detectDisease(file, farmerId) {
  const formData = new FormData();
  formData.append('file', file);
  const url = farmerId ? `${API_BASE}/disease-detection?farmer_id=${farmerId}` : `${API_BASE}/disease-detection`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Disease detection failed. Please try again.');
  }
  return res.json();
}

export async function predictYield(data) {
  const res = await fetch(`${API_BASE}/yield-prediction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Yield prediction failed. Please try again.');
  }
  return res.json();
}

export async function getNotifications(farmerId) {
  const res = await fetch(`${API_BASE}/notifications/${farmerId}`);
  if (!res.ok) throw new Error('Could not fetch notifications.');
  return res.json();
}

export async function uploadProfilePhoto(farmerId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/farmer/${farmerId}/photo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Photo upload failed. Please try again.');
  }
  return res.json(); // { profile_photo: "uploads/profile_photos/..." }
}

export async function deactivateAccount(farmerId) {
  const res = await fetch(`${API_BASE}/farmer/${farmerId}/deactivate`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to deactivate account.');
  }
  return res.json();
}

export async function updateNotificationPrefs(farmerId, prefs) {
  const res = await fetch(`${API_BASE}/farmer/${farmerId}/notification-prefs`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update notification preferences.');
  }
  return res.json();
}

