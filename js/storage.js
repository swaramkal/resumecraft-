import { deepClone } from './utils.js';

export const STORAGE_KEYS = {
  RESUME: 'resumecraft_resume_v1',
  TEMPLATE: 'resumecraft_selected_template_v1',
  ATS: 'resumecraft_ats_result_v1',
  COVER_LETTER: 'resumecraft_cover_letter_v1',
  JOBS: 'resumecraft_job_tracker_v1',
  PORTFOLIO: 'resumecraft_portfolio_v1'
};

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('LocalStorage save failed:', err);
    return false;
  }
}

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return deepClone(fallback);
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Corrupted storage item reset:', key);
    return deepClone(fallback);
  }
}

export function validateResumeSchema(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.personal || typeof data.personal !== 'object') return false;
  if (!Array.isArray(data.sections)) return false;
  return true;
}
