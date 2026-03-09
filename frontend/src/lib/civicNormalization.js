import { issueCategories as CANONICAL_RESIDENT_CATEGORIES } from '../mockData/incidents';

export const CANONICAL_INCIDENT_STATUSES = ['new', 'assigned', 'resolved', 'monitored'];
export const DEFAULT_CANONICAL_CATEGORY = 'Noise Complaint';

const CATEGORY_ALIAS_MAP = {
  'environmental hazard': 'Mosquito Concern',
  'general civic issue': DEFAULT_CANONICAL_CATEGORY,
  'general civic issues': DEFAULT_CANONICAL_CATEGORY,
  'civic issue': DEFAULT_CANONICAL_CATEGORY,
  'issue': DEFAULT_CANONICAL_CATEGORY,
  'potholes': 'Pothole'
};

const STATUS_ALIAS_MAP = {
  new: 'new',
  open: 'new',
  submitted: 'new',
  reported: 'new',
  assigned: 'assigned',
  active: 'assigned',
  in_progress: 'assigned',
  'in progress': 'assigned',
  queued: 'assigned',
  pending: 'assigned',
  resolved: 'resolved',
  completed: 'resolved',
  closed: 'resolved',
  done: 'resolved',
  monitored: 'monitored',
  monitoring: 'monitored',
  watch: 'monitored',
  watchlist: 'monitored'
};

export function normalizeIncidentId(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^INC-[A-Z0-9]+$/i.test(value)) return value.toUpperCase();
  if (/^inc_[a-z0-9]+$/i.test(value)) return `INC-${value.slice(4).toUpperCase()}`;
  if (/^inc[a-z0-9]+$/i.test(value)) return `INC-${value.slice(3).toUpperCase()}`;
  return value;
}

export function normalizeIssueCategory(raw) {
  const value = String(raw || '').trim();
  if (!value) return DEFAULT_CANONICAL_CATEGORY;

  const canonicalMatch = CANONICAL_RESIDENT_CATEGORIES.find((c) => c.toLowerCase() === value.toLowerCase());
  if (canonicalMatch) return canonicalMatch;

  const alias = CATEGORY_ALIAS_MAP[value.toLowerCase()];
  if (alias) return alias;

  return DEFAULT_CANONICAL_CATEGORY;
}

export function normalizeIncidentStatus(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return 'new';
  return STATUS_ALIAS_MAP[value] || 'new';
}

export function sanitizeResidentCategories(items = []) {
  const normalized = items
    .map((item) => normalizeIssueCategory(item))
    .filter((item, idx, arr) => item && arr.indexOf(item) === idx);

  if (normalized.length === CANONICAL_RESIDENT_CATEGORIES.length) return normalized;

  const merged = [
    ...normalized,
    ...CANONICAL_RESIDENT_CATEGORIES.filter((c) => !normalized.includes(c))
  ];

  return merged.slice(0, CANONICAL_RESIDENT_CATEGORIES.length);
}

export { CANONICAL_RESIDENT_CATEGORIES };
