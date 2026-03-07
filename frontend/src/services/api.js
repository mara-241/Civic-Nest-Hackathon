// API service layer - mock data with API-ready structure
import { mockIncidents, issueCategories, interventionTypes } from '../mockData/incidents';
import { mockInsights, mockEscalations } from '../mockData/insights';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Chat API - POST /chat
export const sendChatMessage = async (message) => {
  await delay(1000); // Simulate API latency
  
  // Mock AI response based on keywords
  const lowerMessage = message.toLowerCase();
  let answer, insights, recommendedActions, priority, confidence;
  
  if (lowerMessage.includes('dumping') || lowerMessage.includes('trash') || lowerMessage.includes('garbage')) {
    answer = "I've analyzed your report about illegal dumping. Based on our civic data patterns, this area has seen similar incidents in the past month.";
    insights = [
      "This location is within a known dumping hotspot zone",
      "3 similar reports filed in the past 30 days",
      "Environmental team has active monitoring in this area"
    ];
    recommendedActions = [
      "A cleanup crew will be dispatched within 48-72 hours",
      "Consider reporting to the EPA if hazardous materials are present",
      "Photos will help expedite the response"
    ];
    priority = "high";
    confidence = 0.86;
  } else if (lowerMessage.includes('pothole') || lowerMessage.includes('road')) {
    answer = "Thank you for reporting this road issue. Road maintenance is critical for public safety.";
    insights = [
      "This road section was last inspected 6 months ago",
      "Current paving projects are scheduled for Zone 1",
      "Road conditions affect 200+ daily commuters in this area"
    ];
    recommendedActions = [
      "The road maintenance team will assess within 5-7 days",
      "For immediate safety concerns, contact emergency services",
      "Temporary signage may be placed as a warning"
    ];
    priority = "medium";
    confidence = 0.92;
  } else if (lowerMessage.includes('water') || lowerMessage.includes('flooding') || lowerMessage.includes('mosquito')) {
    answer = "Standing water and drainage issues are a priority concern for public health.";
    insights = [
      "This area is within mosquito spraying district 5",
      "Recent rainfall has increased standing water reports by 40%",
      "Environmental health team monitors weekly"
    ];
    recommendedActions = [
      "Drainage inspection scheduled within 48 hours",
      "Mosquito treatment team will be notified",
      "Remove any containers holding water on your property"
    ];
    priority = "high";
    confidence = 0.89;
  } else {
    answer = "Thank you for your civic report. Your input helps keep Montgomery safe and clean.";
    insights = [
      "Report has been logged in our civic intelligence system",
      "Similar issues in your area will be analyzed",
      "AI-powered triage will prioritize your request"
    ];
    recommendedActions = [
      "A city representative will review within 3-5 business days",
      "You can track your report status in the 'My Reports' section",
      "Add photos or additional details for faster processing"
    ];
    priority = "medium";
    confidence = 0.75;
  }
  
  return {
    answer,
    confidence,
    insights,
    recommended_actions: recommendedActions,
    evidence: ["Montgomery Open Data Portal", "311 Service Requests Database", "Environmental Health Records"],
    assumptions: ["Location is within city limits", "Report describes current conditions"],
    caveats: ["Response time may vary based on priority queue", "Final assessment pending field inspection"],
    ops: {
      priority,
      status: "new",
      recurrence_score: Math.random() * 0.5 + 0.3
    }
  };
};

// Insights API - GET /insight
export const getInsights = async () => {
  await delay(500);
  return mockInsights;
};

// Operations Queue API - GET /ops/queue
export const getOpsQueue = async (filters = {}) => {
  await delay(600);
  
  let filteredIncidents = [...mockIncidents];
  
  if (filters.status) {
    filteredIncidents = filteredIncidents.filter(i => i.status === filters.status);
  }
  if (filters.priority) {
    filteredIncidents = filteredIncidents.filter(i => i.priority === filters.priority);
  }
  if (filters.category) {
    filteredIncidents = filteredIncidents.filter(i => i.issue_category === filters.category);
  }
  if (filters.zone) {
    filteredIncidents = filteredIncidents.filter(i => i.zone === filters.zone);
  }
  
  return {
    incidents: filteredIncidents,
    total: filteredIncidents.length,
    categories: issueCategories
  };
};

// Update incident status - PATCH /ops/incidents/{id}/status
export const updateIncidentStatus = async (incidentId, newStatus, assignedWorker = null) => {
  await delay(400);
  
  const incident = mockIncidents.find(i => i.incident_id === incidentId);
  if (incident) {
    incident.status = newStatus;
    if (assignedWorker) {
      incident.owner = assignedWorker;
    }
    return { success: true, incident };
  }
  return { success: false, error: "Incident not found" };
};

// Hotspots API - GET /ops/hotspots
export const getHotspots = async () => {
  await delay(500);
  return {
    hotspots: mockInsights.hotspots,
    incidents: mockIncidents.map(i => ({
      lat: i.lat,
      lon: i.lon,
      intensity: i.recurrence_score,
      category: i.issue_category,
      id: i.incident_id
    }))
  };
};

// Escalations API - POST /ops/escalations
export const createEscalation = async (escalationData) => {
  await delay(600);
  
  const newEscalation = {
    id: `ESC-${String(mockEscalations.length + 1).padStart(3, '0')}`,
    ...escalationData,
    status: "active",
    created_at: new Date().toISOString(),
    created_by: "Admin User"
  };
  
  mockEscalations.push(newEscalation);
  
  return { success: true, escalation: newEscalation };
};

// Get escalation history
export const getEscalations = async () => {
  await delay(400);
  return {
    escalations: mockEscalations,
    intervention_types: interventionTypes
  };
};

// Resident reports API
export const getMyReports = async () => {
  await delay(500);
  return [
    {
      id: "RPT-001",
      description: "Illegal dumping behind my building",
      category: "Illegal Dumping",
      status: "assigned",
      submitted_at: "2026-03-04T10:30",
      priority: "high"
    },
    {
      id: "RPT-002",
      description: "Street light out on Oak Street",
      category: "Street Light Outage",
      status: "resolved",
      submitted_at: "2026-02-28T15:20",
      priority: "medium"
    },
    {
      id: "RPT-003",
      description: "Pothole causing traffic issues",
      category: "Pothole",
      status: "new",
      submitted_at: "2026-03-05T09:15",
      priority: "medium"
    }
  ];
};
