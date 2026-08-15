export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: GmailMessagePartHeader[];
  body: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailRawMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId?: string;
  internalDate: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailHeader[];
    body: GmailMessagePartBody;
    parts?: GmailMessagePart[];
  };
  sizeEstimate?: number;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  date: Date;
  dateStr: string;
  from: {
    name: string;
    email: string;
    raw: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  attachments: EmailAttachment[];
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isDraft: boolean;
  isSent: boolean;
  isTrash: boolean;
  isSpam: boolean;
}

export interface ParsedThread {
  id: string;
  historyId: string;
  messages: ParsedEmail[];
  snippet: string;
  subject: string;
  latestDate: Date;
  participants: { name: string; email: string }[];
  isUnread: boolean;
  isStarred: boolean;
  labelIds: string[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type?: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

export interface EmailTriageInfo {
  id: string;
  category: 'urgent' | 'action_needed' | 'newsletter' | 'receipt_finance' | 'work_project' | 'personal' | 'low_priority';
  urgencyScore: number; // 1 to 10
  actionSummary: string;
  needsReply: boolean;
  deadline?: string;
  tags: string[];
}

export interface EmailSummary {
  tl_dr: string;
  keyPoints: string[];
  actionItems: {
    task: string;
    owner?: string;
    deadline?: string;
  }[];
  sentiment: 'positive' | 'neutral' | 'urgent' | 'concerned' | 'formal';
  urgency: number; // 1-10
  quickReplies: string[];
}

export interface ComposeDraftPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyHtml?: string;
  bodyText: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  actionSuggestions?: {
    label: string;
    actionType: 'search' | 'triage' | 'draft' | 'clean' | 'filter';
    payload: any;
  }[];
}

export interface InboxHealthMetrics {
  totalEmails: number;
  unreadCount: number;
  urgentCount: number;
  newslettersCount: number;
  cleanableCount: number;
}
