import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Bot, User, Lightbulb, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp, Paperclip, X } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { ChatSkeleton } from '../../components/ui/LoadingSkeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { RecurrenceBar } from '../../components/ui/RecurrenceBar';
import { AIInsightPanel } from '../../components/ui/AIInsightPanel';
import { sendChatMessage, getMyReports } from '../../services/api';
import { MessageSquare, FileText, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const tabRouteMap = {
  assistant: '/resident',
  reports: '/resident/reports',
  followup: '/resident/followup',
};

const routeTabMap = {
  '/resident': 'assistant',
  '/resident/reports': 'reports',
  '/resident/followup': 'followup',
};

const suggestedQueries = [
  "There is illegal dumping behind my building",
  "I found a pothole on my street",
  "Standing water creating mosquito problems",
  "Street lights are out in my neighborhood"
];

// Map issues to categories and zones for AI insight
const issueMapping = {
  'dumping': { category: 'Illegal Dumping', zone: 'Zone 3', intervention: 'Cleanup campaign + signage installation' },
  'trash': { category: 'Illegal Dumping', zone: 'Zone 3', intervention: 'Cleanup campaign + signage installation' },
  'garbage': { category: 'Illegal Dumping', zone: 'Zone 3', intervention: 'Cleanup campaign + signage installation' },
  'pothole': { category: 'Road Damage', zone: 'Zone 1', intervention: 'Priority road repair scheduling' },
  'road': { category: 'Road Damage', zone: 'Zone 1', intervention: 'Priority road repair scheduling' },
  'water': { category: 'Standing Water', zone: 'Zone 5', intervention: 'Drainage inspection + mosquito treatment' },
  'flooding': { category: 'Drainage Issue', zone: 'Zone 2', intervention: 'Emergency drainage assessment' },
  'mosquito': { category: 'Environmental Hazard', zone: 'Zone 5', intervention: 'Mosquito spraying schedule priority' },
  'light': { category: 'Street Light Outage', zone: 'Zone 6', intervention: 'Utilities team dispatch' },
  'default': { category: 'General Civic Issue', zone: 'Zone 4', intervention: 'Standard review and triage' }
};

const getIssueDetails = (message) => {
  const lowerMessage = message.toLowerCase();
  for (const [keyword, details] of Object.entries(issueMapping)) {
    if (keyword !== 'default' && lowerMessage.includes(keyword)) {
      return details;
    }
  }
  return issueMapping.default;
};

const LOCATION_HINT_RE = /(\b\d+[A-Za-z]?\s+[A-Za-z0-9 .,'\-]+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|way|close|court|ct|boulevard|blvd|terrace|place|pl)\b.*)|(\b(?:exact location|location|address|at|near)\s*[:\-]\s*.+)|(\b[A-Za-z0-9 .,'\-]{2,40}\s+(?:and|&)\s+[A-Za-z0-9 .,'\-]{2,40}\b)/i;

const cleanExtract = (value = '') => value.replace(/^[\s:,-]+|[\s:,-]+$/g, '').trim();

const extractReporterName = (text = '') => {
  const normalized = String(text || '').trim();
  if (!normalized) return null;
  const patterns = [
    /\bmy name is\s+([A-Za-z][A-Za-z\s'\-.]{1,80})/i,
    /\bi am\s+([A-Za-z][A-Za-z\s'\-.]{1,80})/i,
    /\bthis is\s+([A-Za-z][A-Za-z\s'\-.]{1,80})/i,
    /\bname\s*[:\-]\s*([A-Za-z][A-Za-z\s'\-.]{1,80})/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const candidate = cleanExtract(match[1]);
      const parts = candidate.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return candidate;
    }
  }

  // Heuristic fallback: accept direct full-name entries like "Jane Doe"
  // or mixed message starts like "jane doe 555 street...".
  const firstSegment = normalized
    .split(/\d|\b(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|way|close|court|ct|boulevard|blvd|terrace|place|pl|location|address|near|at|on)\b/i)[0]
    .trim();
  const words = firstSegment.match(/[A-Za-z][A-Za-z'\-.]*/g) || [];
  const stop = new Set(['there', 'illegal', 'dumping', 'behind', 'my', 'building', 'please', 'help', 'issue', 'report']);

  if (words.length >= 2 && !stop.has(words[0].toLowerCase())) {
    return `${words[0]} ${words[1]}`;
  }

  return null;
};

const extractExactLocation = (text = '') => {
  const normalized = String(text || '').trim();
  if (!normalized) return null;
  const generic = new Set(['unknown', 'my street', 'street', 'my road', 'road', 'my area', 'my neighborhood', 'city', 'montgomery']);
  const explicit = normalized.match(/\b(?:exact location|location|address)\s*[:\-]\s*(.+)$/i);
  const nearAt = normalized.match(/\b(?:at|near|on)\s+([A-Za-z0-9 .,'\-#/]{4,120}?)(?:[.!?]|$)/i);
  const intersection = normalized.match(/\b([A-Za-z0-9 .,'\-]{2,50})\s+(?:and|&)\s+([A-Za-z0-9 .,'\-]{2,50})\b/i);
  const streetLike = normalized.match(/\b\d+[A-Za-z]?\s+[A-Za-z0-9 .,'\-#/]{3,120}\b/i);
  const raw = explicit?.[1] || streetLike?.[0] || (intersection ? `${intersection[1]} & ${intersection[2]}` : null) || nearAt?.[1] || null;
  const candidate = cleanExtract(raw || '');
  const canonical = candidate.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!candidate) return null;
  if ([...generic].some((g) => canonical === g || canonical.startsWith(`${g} `))) return null;
  if (!LOCATION_HINT_RE.test(candidate) && candidate.split(/\s+/).length < 2) return null;
  return candidate;
};

export default function ResidentPortal() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [intakeDraft, setIntakeDraft] = useState({ reporterName: '', exactLocation: '', completedIncidentId: '' });
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const isReportsPage = location.pathname.includes('/resident/reports');
  const isFollowupPage = location.pathname.includes('/resident/followup');
  const [activeTab, setActiveTab] = useState('assistant');
  const intakeComplete = useMemo(() => Boolean(intakeDraft.completedIncidentId), [intakeDraft.completedIncidentId]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      type: 'bot',
      content: {
        answer: "Hello! I'm your CivicNest AI Assistant. I can help you report neighborhood issues, track your existing reports, and provide guidance on civic matters. How can I help you today?",
        isWelcome: true
      }
    }]);
    setIntakeDraft({ reporterName: '', exactLocation: '', completedIncidentId: '' });
  }, []);

  useEffect(() => {
    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1
      ? location.pathname.slice(0, -1)
      : location.pathname;
    setActiveTab(routeTabMap[normalizedPath] || 'assistant');
  }, [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isReportsPage) return;
    let active = true;
    getMyReports().then((items) => {
      if (active) setReports(items || []);
    }).catch(() => {
      if (active) setReports([]);
    });
    return () => { active = false; };
  }, [isReportsPage, messages.length]);

  const handleSend = async (message = input) => {
    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage && attachments.length === 0) return;

    const attachmentNote = attachments.length
      ? `\n\nAttachments: ${attachments.map((f) => f.name).join(', ')}`
      : '';
    const renderedMessage = `${trimmedMessage}${attachmentNote}`.trim();

    const userMessage = { type: 'user', content: renderedMessage };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // If intake already closed, treat update/status messages as follow-up on existing report
    // to avoid re-triggering intake gate or creating duplicate report IDs.
    const followupIntent = /\b(update|status|follow\s*-?up|progress|any\s+update)\b/i.test(trimmedMessage);
    if (intakeComplete && followupIntent) {
      const followupResponse = {
        answer: `You’re following up on Report ID ${intakeDraft.completedIncidentId}. Current status: new. The operations team has it in queue and will update this as triage progresses.`,
        confidence: 0.8,
        insights: ['Follow-up linked to existing report context.'],
        recommended_actions: ['Check My Reports for updates.', 'Add extra details/photos if needed.'],
        evidence: [],
        assumptions: ['Using current UI-side report continuity context.'],
        caveats: ['Live status refresh endpoint for resident follow-up is still limited.'],
        ops: {
          priority: 'medium',
          status: 'new',
          recurrence_score: 0.35,
          incident_id: intakeDraft.completedIncidentId,
        }
      };
      setMessages(prev => [...prev, { type: 'bot', content: followupResponse, userQuery: trimmedMessage }]);
      return;
    }

    const parsedName = extractReporterName(renderedMessage);
    const parsedLocation = extractExactLocation(renderedMessage);
    const nextDraft = {
      ...intakeDraft,
      reporterName: parsedName || intakeDraft.reporterName,
      exactLocation: parsedLocation || intakeDraft.exactLocation,
    };

    const shouldAugmentForIntake = !intakeComplete
      && Boolean(nextDraft.reporterName)
      && Boolean(nextDraft.exactLocation)
      && (!parsedName || !parsedLocation);

    const outboundMessage = shouldAugmentForIntake
      ? `${renderedMessage}\n\nReporter name: ${nextDraft.reporterName}\nExact location: ${nextDraft.exactLocation}`
      : renderedMessage;

    setIsLoading(true);
    setIntakeDraft(nextDraft);

    try {
      const response = await sendChatMessage(outboundMessage);
      const issueDetails = getIssueDetails(trimmedMessage);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: response,
        userQuery: trimmedMessage,
        issueDetails
      }]);

      if (response?.ops?.incident_id) {
        setIntakeDraft((prev) => ({ ...prev, completedIncidentId: response.ops.incident_id }));
      }

      getMyReports().then((items) => setReports(items || []));
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: {
          answer: "I'm sorry, I encountered an error processing your request. Please try again.",
          isError: true
        }
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => (f.type || '').startsWith('image/'));
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeAttachment = (name) => {
    setAttachments((prev) => prev.filter((f) => f.name !== name));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    navigate(tabRouteMap[nextTab] || '/resident');
  };

  return (
    <div className="flex h-screen bg-slate-50" data-testid="resident-portal">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Resident Portal" />
        
        <main className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full px-4">
          <div className="pt-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="bg-white border border-slate-200" data-testid="resident-tabs">
                <TabsTrigger value="assistant" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="resident-assistant-tab-trigger">
                  <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                  Civic Assistant
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="resident-reports-tab-trigger">
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  My Reports
                </TabsTrigger>
                <TabsTrigger value="followup" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="resident-followup-tab-trigger">
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                  Follow-up Status
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isReportsPage ? (
            <div className="flex-1 bg-white border-x border-slate-100 shadow-sm overflow-auto rounded-t-lg mt-4 p-6" data-testid="resident-reports-view">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">My Reports</h3>
              {reports.length === 0 ? (
                <p className="text-sm text-slate-500">No reports yet. Submit a report from Civic Assistant and it will appear here.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <Card key={r.id} className="border-slate-200">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500">Report ID</p>
                            <p className="text-sm font-semibold text-civic-blue">{r.id}</p>
                          </div>
                          <PriorityBadge priority={r.priority || 'medium'} />
                        </div>
                        <p className="text-sm text-slate-700 mt-2">{r.description}</p>
                        <p className="text-xs text-slate-500 mt-1">Status: {r.status} • Submitted: {new Date(r.submitted_at).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : isFollowupPage ? (
            <div className="flex-1 bg-white border-x border-slate-100 shadow-sm overflow-auto rounded-t-lg mt-4 p-6" data-testid="resident-followup-view">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Follow-up Status</h3>
              <p className="text-sm text-slate-500">Open a report in <strong>My Reports</strong> to view status updates.</p>
            </div>
          ) : (
            <div className="flex-1 bg-white border-x border-slate-100 shadow-sm flex flex-col overflow-hidden rounded-t-lg mt-4">
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6">
                  {messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))}
                  {isLoading && <ChatSkeleton />}
                </div>
              </ScrollArea>

              {messages.length <= 1 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-500 mb-3 font-medium">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQueries.map((query) => (
                      <Button
                        key={query}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white hover:bg-civic-blue/5 hover:border-civic-blue/30 hover:text-civic-blue"
                        onClick={() => handleSend(query)}
                        data-testid="suggested-query"
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-slate-100 bg-white">
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2" data-testid="resident-attachments-list">
                    {attachments.map((file) => (
                      <span key={file.name} className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-1 text-xs text-slate-700">
                        {file.name}
                        <button type="button" onClick={() => removeAttachment(file.name)} className="text-slate-500 hover:text-slate-700" data-testid="resident-attachment-remove">
                          <X className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentChange}
                  data-testid="resident-file-input"
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-3"
                    title="Attach images"
                    data-testid="resident-attach-btn"
                  >
                    <Paperclip className="w-4 h-4" strokeWidth={1.5} />
                  </Button>

                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your civic issue..."
                    className="flex-1 bg-slate-50 border-slate-200 focus:border-civic-blue focus:ring-civic-blue/20"
                    disabled={isLoading}
                    data-testid="chat-input"
                  />
                  <Button 
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                    className="bg-civic-blue hover:bg-civic-blue-hover text-white px-6"
                    data-testid="send-btn"
                  >
                    <Send className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Message Bubble Component
const MessageBubble = ({ message }) => {
  const [expanded, setExpanded] = useState(true);
  const isUser = message.type === 'user';
  
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-3 max-w-[80%]">
          <div className="bg-civic-blue text-white px-4 py-3 rounded-2xl rounded-br-md">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    );
  }
  
  const { answer, isWelcome, isError, confidence, insights, recommended_actions, ops } = message.content;
  const issueDetails = message.issueDetails;
  
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isError ? "bg-red-100" : "bg-civic-blue/10"
      )}>
        <Bot className={cn("w-4 h-4", isError ? "text-red-500" : "text-civic-blue")} strokeWidth={1.5} />
      </div>
      
      <div className="flex-1 space-y-4">
        {/* Main Answer */}
        <div className={cn(
          "px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]",
          isError ? "bg-red-50 border border-red-100" : "bg-slate-100"
        )}>
          <p className={cn("text-sm leading-relaxed", isError ? "text-red-700" : "text-slate-700")}>
            {answer}
          </p>
        </div>
        
        {/* Resident report metadata (lean intake UX) */}
        {!isWelcome && !isError && message.content?.ops?.incident_id && /report has been logged/i.test(answer || '') && (
          <Card className="border-slate-200 max-w-[85%]">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-slate-500">Report ID</p>
              <p className="text-sm font-semibold text-civic-blue" data-testid="resident-report-id">{message.content.ops.incident_id}</p>
            </CardContent>
          </Card>
        )}

        {/* Legacy analytics panel hidden for resident intake flow */}
        {false && !isWelcome && !isError && confidence && issueDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-full">
            {/* AI Insight Panel */}
            <AIInsightPanel
              issueCategory={issueDetails.category}
              zone={issueDetails.zone}
              recurrenceScore={ops?.recurrence_score || 0.5}
              suggestedIntervention={issueDetails.intervention}
              confidence={confidence}
              priority={ops?.priority}
            />
            
            {/* Detailed Response Card */}
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Header with expand toggle */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Analysis Details</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="text-slate-500 hover:text-slate-700 h-7 px-2"
                  >
                    {expanded ? (
                      <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </Button>
                </div>
                
                {/* Expandable Details */}
                {expanded && (
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-auto">
                    {/* Insights */}
                    {insights?.length > 0 && (
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                          <span className="text-sm font-medium text-slate-700">AI Insights</span>
                        </div>
                        <ul className="space-y-1.5">
                          {insights.map((insight, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Recommended Actions */}
                    {recommended_actions?.length > 0 && (
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-civic-green" strokeWidth={1.5} />
                          <span className="text-sm font-medium text-slate-700">Recommended Actions</span>
                        </div>
                        <ul className="space-y-1.5">
                          {recommended_actions.map((action, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-civic-green mt-2 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Follow-up Actions */}
                <div className="px-4 py-3 bg-slate-50 flex gap-2 border-t border-slate-100">
                  <Button size="sm" variant="outline" className="text-civic-green border-civic-green/30 hover:bg-civic-green/5">
                    <CheckCircle2 className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    Resolved
                  </Button>
                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                    <AlertTriangle className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    Still Unresolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
