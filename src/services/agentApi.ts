import { EmailSummary, EmailTriageInfo, AgentChatMessage } from '../types';

export const agentApi = {
  async summarizeEmail(email: {
    subject: string;
    from: string;
    date: string;
    bodyText: string;
  }): Promise<EmailSummary> {
    const res = await fetch('/api/agent/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      throw new Error(`Failed to summarize email: ${res.statusText}`);
    }
    return res.json();
  },

  async triageEmails(emails: { id: string; subject: string; from: string; snippet: string; date: string }[]): Promise<EmailTriageInfo[]> {
    const res = await fetch('/api/agent/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });
    if (!res.ok) {
      throw new Error(`Failed to triage emails: ${res.statusText}`);
    }
    const data = await res.json();
    return data.triage || [];
  },

  async draftReply(params: {
    originalSubject: string;
    originalSender: string;
    originalBody: string;
    tone: 'professional' | 'friendly' | 'concise' | 'assertive' | 'formal';
    customPrompt?: string;
    userEmail?: string;
  }): Promise<{ subject: string; bodyText: string; bodyHtml?: string }> {
    const res = await fetch('/api/agent/draft-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Failed to draft reply: ${res.statusText}`);
    }
    return res.json();
  },

  async translateNaturalSearch(naturalQuery: string): Promise<{ gmailQuery: string; explanation: string }> {
    const res = await fetch('/api/agent/natural-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naturalQuery }),
    });
    if (!res.ok) {
      throw new Error(`Failed to translate search query: ${res.statusText}`);
    }
    return res.json();
  },

  async chatWithAgent(params: {
    message: string;
    history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
    inboxContext?: any;
  }): Promise<{ reply: string; suggestions?: any[] }> {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Failed to chat with agent: ${res.statusText}`);
    }
    return res.json();
  },
};
