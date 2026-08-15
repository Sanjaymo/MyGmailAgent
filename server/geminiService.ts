import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

export const agentGeminiService = {
  // Summarize full email or thread
  async summarizeEmail(email: {
    subject: string;
    from: string;
    date: string;
    bodyText: string;
  }) {
    const ai = getAI();
    if (!ai) {
      // Fallback summary when key is not configured
      return {
        tl_dr: `Email from ${email.from} regarding "${email.subject}".`,
        keyPoints: [
          `Received on ${email.date}`,
          'Contains details regarding ' + email.subject
        ],
        actionItems: [
          { task: 'Review email contents and respond if necessary', owner: 'Me' }
        ],
        sentiment: 'neutral',
        urgency: 5,
        quickReplies: [
          'Thanks for the update, will review shortly.',
          'Understood, please proceed.',
          'Could you provide more context on this?'
        ]
      };
    }

    const prompt = `You are an elite executive AI email assistant. Analyze this email and provide a crisp summary, action items, sentiment, urgency (1-10), and 3 smart quick reply choices.

Email Details:
Sender: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body:
${email.bodyText.slice(0, 4000)}

Respond strictly in JSON format matching this schema:
{
  "tl_dr": "One or two sentence high-impact summary",
  "keyPoints": ["Key point 1", "Key point 2"],
  "actionItems": [
    { "task": "Action needed", "owner": "Who should do it", "deadline": "Mentioned deadline or None" }
  ],
  "sentiment": "positive" | "neutral" | "urgent" | "concerned" | "formal",
  "urgency": number (1 to 10, where 10 is immediate crisis/action needed and 1 is general newsletter),
  "quickReplies": ["Short response 1", "Short response 2", "Short response 3"]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text?.trim() || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini summarize error:', err);
      return {
        tl_dr: `Summary: ${email.subject}`,
        keyPoints: ['Failed to generate detailed AI breakdown.'],
        actionItems: [{ task: 'Check original message', owner: 'Me' }],
        sentiment: 'neutral',
        urgency: 5,
        quickReplies: ['Thank you!', 'Received with thanks.', 'I will review this today.']
      };
    }
  },

  // Batch triage emails
  async triageEmails(emails: { id: string; subject: string; from: string; snippet: string; date: string }[]) {
    const ai = getAI();
    if (!ai || emails.length === 0) {
      return emails.map(e => ({
        id: e.id,
        category: 'work_project',
        urgencyScore: 5,
        actionSummary: 'Review message',
        needsReply: true,
        tags: ['Inbox']
      }));
    }

    const prompt = `You are an autonomous AI Mail Agent. Triage these ${emails.length} emails from the user's inbox.
For each email, classify into one of: 'urgent', 'action_needed', 'newsletter', 'receipt_finance', 'work_project', 'personal', 'low_priority'.
Assign an urgency score (1-10), indicate if it needs a reply (boolean), provide a 4-8 word action summary, and suggest 1-2 tag names.

Emails to triage:
${JSON.stringify(emails.slice(0, 20), null, 2)}

Respond with JSON in this format:
{
  "triage": [
    {
      "id": "email id",
      "category": "urgent" | "action_needed" | "newsletter" | "receipt_finance" | "work_project" | "personal" | "low_priority",
      "urgencyScore": number (1-10),
      "actionSummary": "Brief action instruction",
      "needsReply": true | false,
      "tags": ["Tag1", "Tag2"]
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text?.trim() || '{"triage":[]}';
      const parsed = JSON.parse(text);
      return parsed.triage || [];
    } catch (err) {
      console.error('Gemini triage error:', err);
      return emails.map(e => ({
        id: e.id,
        category: 'work_project',
        urgencyScore: 5,
        actionSummary: 'Review message',
        needsReply: true,
        tags: ['Inbox']
      }));
    }
  },

  // Draft a smart reply or new email
  async draftReply(params: {
    originalSubject: string;
    originalSender: string;
    originalBody: string;
    tone: 'professional' | 'friendly' | 'concise' | 'assertive' | 'formal';
    customPrompt?: string;
    userEmail?: string;
  }) {
    const ai = getAI();
    if (!ai) {
      return {
        subject: params.originalSubject.startsWith('Re:') ? params.originalSubject : `Re: ${params.originalSubject}`,
        bodyText: `Hi,\n\nThank you for your email. I have reviewed the details and will get back to you with next steps shortly.\n\nBest regards,`,
      };
    }

    const prompt = `You are an expert AI email communicator. Draft an email reply based on the context.

Context:
Subject: ${params.originalSubject}
From: ${params.originalSender}
Original Message:
${params.originalBody.slice(0, 3000)}

Requirements:
- Tone: ${params.tone}
- User Instructions: ${params.customPrompt || 'Provide an appropriate, complete, and polite reply addressing the sender.'}
- Structure: Clear greeting, concise paragraphs, clear call to action or answers, professional sign-off.
- Do NOT include placeholder brackets like [Your Name] if possible, or use standard sign off.

Respond with JSON:
{
  "subject": "Email Subject",
  "bodyText": "Plain text email body with linebreaks",
  "bodyHtml": "HTML formatted email body with <p>, <br>, etc."
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text?.trim() || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini draft error:', err);
      return {
        subject: params.originalSubject.startsWith('Re:') ? params.originalSubject : `Re: ${params.originalSubject}`,
        bodyText: `Thank you for reaching out. I will follow up on this promptly.`,
      };
    }
  },

  // Convert natural language to Gmail search query string
  async translateNaturalSearch(naturalQuery: string) {
    const ai = getAI();
    if (!ai) {
      return {
        gmailQuery: naturalQuery,
        explanation: 'Direct text search'
      };
    }

    const prompt = `Convert this natural language email search query into standard Gmail search syntax.
User Query: "${naturalQuery}"

Examples of Gmail operators:
- from:someone@example.com
- to:someone
- subject:meeting
- has:attachment
- filename:pdf
- is:unread
- is:starred
- category:promotions / category:primary / category:updates
- label:work
- after:2026/01/01
- before:2026/08/01
- older_than:7d / newer_than:30d

Respond with JSON:
{
  "gmailQuery": "the exact search string to send to Gmail API",
  "explanation": "Short 1-sentence explanation of the filter applied"
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text?.trim() || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini natural search error:', err);
      return {
        gmailQuery: naturalQuery,
        explanation: 'Searching by keyword'
      };
    }
  },

  // Interactive copilot chat
  async chatWithAgent(params: {
    message: string;
    history: { role: 'user' | 'model'; parts: { text: string }[] }[];
    inboxContext?: {
      userEmail?: string;
      recentEmails?: { from: string; subject: string; snippet: string; date: string; isUnread: boolean }[];
      selectedEmail?: { from: string; subject: string; bodyText: string; date: string };
    };
  }) {
    const ai = getAI();
    if (!ai) {
      return {
        reply: "I am your Gmail Mail Agent. I can help you summarize emails, draft responses, triage unread messages, and keep your inbox organized.",
        suggestions: [
          { label: "Triage unread emails", actionType: "triage", payload: {} },
          { label: "Search newsletters", actionType: "search", payload: { query: "category:promotions OR category:updates" } }
        ]
      };
    }

    const systemInstruction = `You are "MyGmailAgent", a proactive, friendly, and precise AI assistant embedded in the user's Gmail workspace.
Current User: ${params.inboxContext?.userEmail || 'User'}
Current Date: 2026-08-14

You have access to the user's mailbox context.
Recent emails in view:
${JSON.stringify(params.inboxContext?.recentEmails?.slice(0, 10) || [], null, 2)}

Selected thread/email (if any):
${params.inboxContext?.selectedEmail ? JSON.stringify(params.inboxContext.selectedEmail) : 'None currently selected'}

Help the user manage emails, synthesize information, find specific messages, draft polite or assertive replies, suggest labels, and give inbox decluttering tips.
Keep responses concise, clear, and actionable.

Respond in JSON:
{
  "reply": "Your markdown-formatted response message to the user",
  "suggestions": [
    { "label": "Button text", "actionType": "search" | "triage" | "draft" | "clean" | "filter", "payload": {} }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: `User request: ${params.message}` }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        }
      });

      const text = response.text?.trim() || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini chat error:', err);
      return {
        reply: "I'm here to help manage your inbox. You can ask me to draft replies, summarize threads, or search for emails.",
        suggestions: []
      };
    }
  }
};
