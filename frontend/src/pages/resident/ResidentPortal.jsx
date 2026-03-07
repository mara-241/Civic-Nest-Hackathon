import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Lightbulb, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { ChatSkeleton } from '../../components/ui/LoadingSkeleton';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { RecurrenceBar } from '../../components/ui/RecurrenceBar';
import { AIInsightPanel } from '../../components/ui/AIInsightPanel';
import { sendChatMessage } from '../../services/api';
import { MessageSquare, FileText, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const sidebarItems = [
  { id: 'assistant', label: 'Civic Assistant', icon: MessageSquare, path: '/resident' },
  { id: 'reports', label: 'My Reports', icon: FileText, path: '/resident/reports' },
  { id: 'followup', label: 'Follow-up Status', icon: Clock, path: '/resident/followup' }
];

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

export default function ResidentPortal() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      type: 'bot',
      content: {
        answer: "Hello! I'm your CivicNest AI Assistant. I can help you report neighborhood issues, track your existing reports, and provide guidance on civic matters. How can I help you today?",
        isWelcome: true
      }
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (message = input) => {
    if (!message.trim()) return;
    
    const userMessage = { type: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(message);
      const issueDetails = getIssueDetails(message);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: response,
        userQuery: message,
        issueDetails
      }]);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50" data-testid="resident-portal">
      <Sidebar items={sidebarItems} persona="resident" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Resident Portal" />
        
        <main className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full px-4">
          {/* Chat Container */}
          <div className="flex-1 bg-white border-x border-slate-100 shadow-sm flex flex-col overflow-hidden rounded-t-lg mt-4">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} />
                ))}
                
                {isLoading && <ChatSkeleton />}
              </div>
            </ScrollArea>

            {/* Quick Suggestions */}
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

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3">
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
                  disabled={!input.trim() || isLoading}
                  className="bg-civic-blue hover:bg-civic-blue-hover text-white px-6"
                  data-testid="send-btn"
                >
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          </div>
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
        
        {/* AI Insight Panel (New visual component) */}
        {!isWelcome && !isError && confidence && issueDetails && (
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
