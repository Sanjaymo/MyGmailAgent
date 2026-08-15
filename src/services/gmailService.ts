import { getAccessToken } from '../lib/firebase';
import { 
  GmailRawMessage, 
  ParsedEmail, 
  ParsedThread, 
  GmailLabel, 
  ComposeDraftPayload,
  EmailAttachment
} from '../types';

const GMAIL_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Base64URL decoder supporting UTF-8
function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (e) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

// Base64URL encoder supporting UTF-8
function encodeBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Parse sender "Name <email@example.com>" or "email@example.com"
function parseSender(fromHeader: string) {
  if (!fromHeader) return { name: 'Unknown', email: '', raw: '' };
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, '').trim();
    return { name: name || match[2], email: match[2].trim(), raw: fromHeader };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim(), raw: fromHeader };
}

// Parse list of emails "a@b.com, c@d.com"
function parseRecipientList(headerVal?: string): string[] {
  if (!headerVal) return [];
  return headerVal
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// Recursively find text, html, and attachments in message parts
function extractParts(payload: GmailRawMessage['payload']) {
  let bodyText = '';
  let bodyHtml = '';
  const attachments: EmailAttachment[] = [];

  function traverse(part: any) {
    if (!part) return;

    if (part.filename && part.body && (part.body.attachmentId || part.body.size > 0)) {
      attachments.push({
        id: part.body.attachmentId || part.partId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0
      });
    }

    if (part.mimeType === 'text/plain' && part.body?.data && !bodyText) {
      bodyText = decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body?.data && !bodyHtml) {
      bodyHtml = decodeBase64Url(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(traverse);
    }
  }

  traverse(payload);

  // If top-level body had data directly (single part email)
  if (!bodyText && !bodyHtml && payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') {
      bodyHtml = decoded;
    } else {
      bodyText = decoded;
    }
  }

  // Fallback: If only HTML exists, create a plain text extract
  if (!bodyText && bodyHtml) {
    const div = document.createElement('div');
    div.innerHTML = bodyHtml;
    bodyText = div.textContent || div.innerText || '';
  }

  return { bodyText, bodyHtml, attachments };
}

// Convert Gmail raw message to ParsedEmail
export function parseGmailMessage(raw: GmailRawMessage): ParsedEmail {
  const headers = raw.payload?.headers || [];
  const getHeader = (name: string) => {
    const h = headers.find(item => item.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  const fromVal = getHeader('From');
  const toVal = getHeader('To');
  const ccVal = getHeader('Cc');
  const bccVal = getHeader('Bcc');
  const subject = getHeader('Subject') || '(No Subject)';
  const dateVal = getHeader('Date');

  let parsedDate = new Date();
  if (raw.internalDate) {
    parsedDate = new Date(parseInt(raw.internalDate, 10));
  } else if (dateVal) {
    parsedDate = new Date(dateVal);
  }

  const { bodyText, bodyHtml, attachments } = extractParts(raw.payload);
  const labelIds = raw.labelIds || [];

  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds,
    snippet: raw.snippet || '',
    date: parsedDate,
    dateStr: parsedDate.toLocaleString(),
    from: parseSender(fromVal),
    to: parseRecipientList(toVal),
    cc: parseRecipientList(ccVal),
    bcc: parseRecipientList(bccVal),
    subject,
    bodyText: bodyText.trim(),
    bodyHtml: bodyHtml.trim(),
    attachments,
    isUnread: labelIds.includes('UNREAD'),
    isStarred: labelIds.includes('STARRED'),
    isImportant: labelIds.includes('IMPORTANT'),
    isDraft: labelIds.includes('DRAFT'),
    isSent: labelIds.includes('SENT'),
    isTrash: labelIds.includes('TRASH'),
    isSpam: labelIds.includes('SPAM'),
  };
}

// Request helper with Authorization Header
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication token is missing. Please sign in with Google.');
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // not JSON
    }
    const message = errorJson?.error?.message || response.statusText || 'Gmail API request failed';
    throw new Error(`Gmail API Error (${response.status}): ${message}`);
  }

  return response.json();
}

export const gmailService = {
  // Get connected user profile
  async getUserProfile(): Promise<{ emailAddress: string; messagesTotal: number; threadsTotal: number; historyId: string }> {
    return fetchWithAuth(`${GMAIL_BASE_URL}/profile`);
  },

  // List messages with search query / label filters
  async listMessages(options: {
    query?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
    includeSpamTrash?: boolean;
  } = {}): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string; resultSizeEstimate: number }> {
    const params = new URLSearchParams();
    if (options.maxResults) params.set('maxResults', options.maxResults.toString());
    if (options.query) params.set('q', options.query);
    if (options.pageToken) params.set('pageToken', options.pageToken);
    if (options.includeSpamTrash) params.set('includeSpamTrash', 'true');
    if (options.labelIds && options.labelIds.length > 0) {
      options.labelIds.forEach(lbl => params.append('labelIds', lbl));
    }

    const url = `${GMAIL_BASE_URL}/messages?${params.toString()}`;
    const result = await fetchWithAuth(url);
    return {
      messages: result.messages || [],
      nextPageToken: result.nextPageToken,
      resultSizeEstimate: result.resultSizeEstimate || 0,
    };
  },

  // Get full message details
  async getMessage(messageId: string): Promise<ParsedEmail> {
    const url = `${GMAIL_BASE_URL}/messages/${messageId}?format=full`;
    const raw = await fetchWithAuth(url);
    return parseGmailMessage(raw);
  },

  // Batch get multiple messages in parallel (chunked)
  async getMessagesBatch(messageIds: string[], chunkSize = 10): Promise<ParsedEmail[]> {
    const results: ParsedEmail[] = [];
    for (let i = 0; i < messageIds.length; i += chunkSize) {
      const chunk = messageIds.slice(i, i + chunkSize);
      const fetched = await Promise.allSettled(chunk.map(id => this.getMessage(id)));
      fetched.forEach(res => {
        if (res.status === 'fulfilled' && res.value) {
          results.push(res.value);
        }
      });
    }
    return results;
  },

  // Get full thread messages
  async getThread(threadId: string): Promise<ParsedThread> {
    const url = `${GMAIL_BASE_URL}/threads/${threadId}?format=full`;
    const rawThread = await fetchWithAuth(url);
    const messages = (rawThread.messages || []).map(parseGmailMessage);

    const participantsMap = new Map<string, string>();
    messages.forEach(m => {
      if (m.from.email) participantsMap.set(m.from.email, m.from.name);
      m.to.forEach(t => {
        const parsed = parseSender(t);
        if (parsed.email) participantsMap.set(parsed.email, parsed.name);
      });
    });

    const participants = Array.from(participantsMap.entries()).map(([email, name]) => ({ email, name }));
    const latestMessage = messages[messages.length - 1] || messages[0];
    const isUnread = messages.some(m => m.isUnread);
    const isStarred = messages.some(m => m.isStarred);
    const allLabels: string[] = Array.from(new Set<string>(messages.flatMap(m => m.labelIds)));

    return {
      id: rawThread.id,
      historyId: rawThread.historyId,
      messages,
      snippet: rawThread.snippet || latestMessage?.snippet || '',
      subject: latestMessage?.subject || '(No Subject)',
      latestDate: latestMessage?.date || new Date(),
      participants,
      isUnread,
      isStarred,
      labelIds: allLabels,
    };
  },

  // List all available labels
  async listLabels(): Promise<GmailLabel[]> {
    const result = await fetchWithAuth(`${GMAIL_BASE_URL}/labels`);
    return result.labels || [];
  },

  // Create a new user label
  async createLabel(name: string): Promise<GmailLabel> {
    return fetchWithAuth(`${GMAIL_BASE_URL}/labels`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      }),
    });
  },

  // Modify labels on a message (Archive, Star, Mark Unread, Apply Label)
  async modifyMessage(messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []): Promise<ParsedEmail> {
    const result = await fetchWithAuth(`${GMAIL_BASE_URL}/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds,
        removeLabelIds,
      }),
    });
    return parseGmailMessage(result);
  },

  // Batch modify multiple messages
  async batchModifyMessages(messageIds: string[], addLabelIds: string[] = [], removeLabelIds: string[] = []): Promise<void> {
    if (messageIds.length === 0) return;
    await fetchWithAuth(`${GMAIL_BASE_URL}/messages/batchModify`, {
      method: 'POST',
      body: JSON.stringify({
        ids: messageIds,
        addLabelIds,
        removeLabelIds,
      }),
    });
  },

  // Move message to trash
  async trashMessage(messageId: string): Promise<void> {
    await fetchWithAuth(`${GMAIL_BASE_URL}/messages/${messageId}/trash`, {
      method: 'POST',
    });
  },

  // Restore message from trash
  async untrashMessage(messageId: string): Promise<void> {
    await fetchWithAuth(`${GMAIL_BASE_URL}/messages/${messageId}/untrash`, {
      method: 'POST',
    });
  },

  // Permanently delete message
  async deleteMessage(messageId: string): Promise<void> {
    await fetchWithAuth(`${GMAIL_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Send an email (creates RFC 2822 formatted raw message)
  async sendEmail(payload: ComposeDraftPayload): Promise<{ id: string; threadId: string }> {
    const rawRfc = this.buildRfc2822(payload);
    const encoded = encodeBase64Url(rawRfc);

    const body: any = { raw: encoded };
    if (payload.threadId) {
      body.threadId = payload.threadId;
    }

    return fetchWithAuth(`${GMAIL_BASE_URL}/messages/send`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Create a draft email
  async createDraft(payload: ComposeDraftPayload): Promise<{ id: string; message: { id: string; threadId: string } }> {
    const rawRfc = this.buildRfc2822(payload);
    const encoded = encodeBase64Url(rawRfc);

    const body: any = {
      message: {
        raw: encoded,
        ...(payload.threadId ? { threadId: payload.threadId } : {})
      }
    };

    return fetchWithAuth(`${GMAIL_BASE_URL}/drafts`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Construct RFC 2822 raw text string
  buildRfc2822(payload: ComposeDraftPayload): string {
    const lines: string[] = [];
    lines.push(`To: ${payload.to}`);
    if (payload.cc) lines.push(`Cc: ${payload.cc}`);
    if (payload.bcc) lines.push(`Bcc: ${payload.bcc}`);
    lines.push(`Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`);
    if (payload.inReplyTo) lines.push(`In-Reply-To: ${payload.inReplyTo}`);
    if (payload.references) lines.push(`References: ${payload.references}`);
    lines.push('MIME-Version: 1.0');

    if (payload.bodyHtml) {
      const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset="UTF-8"');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(payload.bodyText || '');
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/html; charset="UTF-8"');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(payload.bodyHtml);
      lines.push('');
      lines.push(`--${boundary}--`);
    } else {
      lines.push('Content-Type: text/plain; charset="UTF-8"');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(payload.bodyText || '');
    }

    return lines.join('\r\n');
  }
};
