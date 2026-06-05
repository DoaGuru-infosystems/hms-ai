/**
 * api.js — Centralized API helper for MedBrainix HMS Frontend
 * Phase 1: reads VITE_API_BASE env var, attaches JWT + role headers automatically.
 */

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';

function getAuthHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const headers = { 'Content-Type': 'application/json' };

    // Send JWT token if present
    if (user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    // Legacy fallback headers (backward-compatible)
    if (user.role) headers['x-user-role'] = user.role;
    if (user.id || user.empNo) headers['x-user-id'] = user.id || user.empNo;
    if (user.name || user.firstName) {
      headers['x-user-name'] = user.name || `${user.firstName} ${user.lastName}`;
    }

    return headers;
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

async function request(method, path, body) {
  const opts = { method, headers: getAuthHeaders() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};
