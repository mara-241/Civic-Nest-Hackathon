// Mock data simulating Montgomery Open Data Portal datasets
export const mockIncidents = [
  {
    incident_id: "INC-1024",
    source_dataset: "311 Service Requests",
    issue_category: "Illegal Dumping",
    reported_at: "2026-03-05T14:21",
    lat: 32.366,
    lon: -86.299,
    zone: "Zone 4",
    status: "new",
    priority: "high",
    recurrence_score: 0.78,
    owner: "Worker Team A",
    recommended_action: "Schedule cleanup and signage",
    confidence: 0.86,
    description: "Large pile of debris dumped behind commercial building"
  },
  {
    incident_id: "INC-1025",
    source_dataset: "Code Violations",
    issue_category: "Overgrown Vegetation",
    reported_at: "2026-03-04T09:15",
    lat: 32.372,
    lon: -86.312,
    zone: "Zone 2",
    status: "assigned",
    priority: "medium",
    recurrence_score: 0.45,
    owner: "Worker Team B",
    recommended_action: "Issue warning notice to property owner",
    confidence: 0.72,
    description: "Grass and weeds exceeding 12 inches on vacant lot"
  },
  {
    incident_id: "INC-1026",
    source_dataset: "Environmental Nuisances",
    issue_category: "Standing Water",
    reported_at: "2026-03-03T16:42",
    lat: 32.358,
    lon: -86.285,
    zone: "Zone 5",
    status: "monitored",
    priority: "high",
    recurrence_score: 0.92,
    owner: "Environmental Team",
    recommended_action: "Inspect drainage and schedule mosquito treatment",
    confidence: 0.91,
    description: "Persistent standing water creating mosquito breeding ground"
  },
  {
    incident_id: "INC-1027",
    source_dataset: "311 Service Requests",
    issue_category: "Pothole",
    reported_at: "2026-03-02T11:30",
    lat: 32.379,
    lon: -86.306,
    zone: "Zone 1",
    status: "resolved",
    priority: "medium",
    recurrence_score: 0.23,
    owner: "Road Maintenance",
    recommended_action: "Schedule road repair crew",
    confidence: 0.95,
    description: "Large pothole on main road causing traffic issues"
  },
  {
    incident_id: "INC-1028",
    source_dataset: "Code Violations",
    issue_category: "Abandoned Vehicle",
    reported_at: "2026-03-01T08:20",
    lat: 32.361,
    lon: -86.291,
    zone: "Zone 3",
    status: "new",
    priority: "low",
    recurrence_score: 0.31,
    owner: null,
    recommended_action: "Tag vehicle and initiate removal process",
    confidence: 0.88,
    description: "Vehicle abandoned on street for over 72 hours"
  },
  {
    incident_id: "INC-1029",
    source_dataset: "Environmental Nuisances",
    issue_category: "Illegal Dumping",
    reported_at: "2026-02-28T15:45",
    lat: 32.368,
    lon: -86.295,
    zone: "Zone 4",
    status: "assigned",
    priority: "high",
    recurrence_score: 0.85,
    owner: "Worker Team A",
    recommended_action: "Deploy cleanup crew and install signage",
    confidence: 0.82,
    description: "Recurring dumping site near residential area"
  },
  {
    incident_id: "INC-1030",
    source_dataset: "Maintained Ditches",
    issue_category: "Drainage Issue",
    reported_at: "2026-02-27T10:12",
    lat: 32.375,
    lon: -86.318,
    zone: "Zone 2",
    status: "new",
    priority: "medium",
    recurrence_score: 0.56,
    owner: null,
    recommended_action: "Clear debris from drainage ditch",
    confidence: 0.79,
    description: "Blocked drainage causing street flooding during rain"
  },
  {
    incident_id: "INC-1031",
    source_dataset: "311 Service Requests",
    issue_category: "Street Light Outage",
    reported_at: "2026-02-26T19:30",
    lat: 32.363,
    lon: -86.302,
    zone: "Zone 6",
    status: "assigned",
    priority: "medium",
    recurrence_score: 0.28,
    owner: "Utilities Team",
    recommended_action: "Replace bulb or repair electrical connection",
    confidence: 0.94,
    description: "Multiple street lights out on residential block"
  },
  {
    incident_id: "INC-1032",
    source_dataset: "Mosquito Spraying Districts",
    issue_category: "Mosquito Concern",
    reported_at: "2026-02-25T14:00",
    lat: 32.355,
    lon: -86.288,
    zone: "Zone 5",
    status: "monitored",
    priority: "high",
    recurrence_score: 0.89,
    owner: "Environmental Team",
    recommended_action: "Add to next spraying schedule",
    confidence: 0.87,
    description: "High mosquito activity near park and playground"
  },
  {
    incident_id: "INC-1033",
    source_dataset: "Paving Projects",
    issue_category: "Road Damage",
    reported_at: "2026-02-24T09:45",
    lat: 32.382,
    lon: -86.310,
    zone: "Zone 1",
    status: "new",
    priority: "high",
    recurrence_score: 0.67,
    owner: null,
    recommended_action: "Add to paving project queue",
    confidence: 0.83,
    description: "Significant road deterioration requiring repaving"
  }
];

export const issueCategories = [
  "Illegal Dumping",
  "Overgrown Vegetation",
  "Standing Water",
  "Pothole",
  "Abandoned Vehicle",
  "Drainage Issue",
  "Street Light Outage",
  "Mosquito Concern",
  "Road Damage",
  "Graffiti",
  "Noise Complaint"
];

export const zones = [
  "Zone 1",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
  "Zone 6"
];

export const statuses = ["new", "assigned", "resolved", "monitored"];
export const priorities = ["low", "medium", "high"];

export const interventionTypes = [
  "Cleanup campaign",
  "Signage installation",
  "Patrol timing adjustment",
  "Community outreach"
];
