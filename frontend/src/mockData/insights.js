// Mock insights data for admin dashboard
export const mockInsights = {
  summary: {
    total_incidents: 156,
    resolved_this_week: 42,
    avg_resolution_time: "2.3 days",
    high_priority_count: 23
  },
  trends: [
    { date: "2026-02-01", incidents: 18, resolved: 12 },
    { date: "2026-02-08", incidents: 22, resolved: 15 },
    { date: "2026-02-15", incidents: 25, resolved: 19 },
    { date: "2026-02-22", incidents: 21, resolved: 18 },
    { date: "2026-03-01", incidents: 28, resolved: 20 },
    { date: "2026-03-08", incidents: 32, resolved: 22 }
  ],
  categoryBreakdown: [
    { category: "Illegal Dumping", count: 34, percentage: 22 },
    { category: "Pothole", count: 28, percentage: 18 },
    { category: "Overgrown Vegetation", count: 24, percentage: 15 },
    { category: "Standing Water", count: 19, percentage: 12 },
    { category: "Street Light Outage", count: 17, percentage: 11 },
    { category: "Drainage Issue", count: 14, percentage: 9 },
    { category: "Other", count: 20, percentage: 13 }
  ],
  zoneRanking: [
    { zone: "Zone 4", incidents: 38, recurrence_score: 0.82, risk: "high" },
    { zone: "Zone 5", incidents: 32, recurrence_score: 0.75, risk: "high" },
    { zone: "Zone 2", incidents: 28, recurrence_score: 0.58, risk: "medium" },
    { zone: "Zone 1", incidents: 24, recurrence_score: 0.45, risk: "medium" },
    { zone: "Zone 3", incidents: 19, recurrence_score: 0.32, risk: "low" },
    { zone: "Zone 6", incidents: 15, recurrence_score: 0.28, risk: "low" }
  ],
  hotspots: [
    { area: "Downtown Commercial", lat: 32.366, lon: -86.299, incidents: 12, recurrence_score: 0.85 },
    { area: "Riverside Park", lat: 32.355, lon: -86.288, incidents: 9, recurrence_score: 0.78 },
    { area: "Industrial District", lat: 32.372, lon: -86.312, incidents: 8, recurrence_score: 0.72 },
    { area: "Old Town Square", lat: 32.379, lon: -86.306, incidents: 7, recurrence_score: 0.65 }
  ]
};

export const mockEscalations = [
  {
    id: "ESC-001",
    area: "Downtown Commercial",
    issue_category: "Illegal Dumping",
    recurrence_score: 0.85,
    intervention_type: "Cleanup campaign",
    status: "active",
    created_at: "2026-03-01T10:00",
    created_by: "Admin User"
  },
  {
    id: "ESC-002",
    area: "Riverside Park",
    issue_category: "Mosquito Concern",
    recurrence_score: 0.78,
    intervention_type: "Community outreach",
    status: "completed",
    created_at: "2026-02-25T14:30",
    created_by: "Admin User"
  },
  {
    id: "ESC-003",
    area: "Industrial District",
    issue_category: "Standing Water",
    recurrence_score: 0.72,
    intervention_type: "Patrol timing adjustment",
    status: "active",
    created_at: "2026-02-28T09:15",
    created_by: "Admin User"
  }
];
