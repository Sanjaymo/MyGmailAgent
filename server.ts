import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { agentGeminiService } from './server/geminiService';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '10mb' }));

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'MyGmailAgent', 
      geminiConfigured: !!process.env.GEMINI_API_KEY 
    });
  });

  // Summarize Email
  app.post('/api/agent/summarize', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email data is required' });
      }
      const summary = await agentGeminiService.summarizeEmail(email);
      res.json(summary);
    } catch (error: any) {
      console.error('Error in /api/agent/summarize:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Triage Batch of Emails
  app.post('/api/agent/triage', async (req, res) => {
    try {
      const { emails } = req.body;
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: 'Emails array is required' });
      }
      const triageResults = await agentGeminiService.triageEmails(emails);
      res.json({ triage: triageResults });
    } catch (error: any) {
      console.error('Error in /api/agent/triage:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Draft Smart Reply / Email
  app.post('/api/agent/draft-reply', async (req, res) => {
    try {
      const { originalSubject, originalSender, originalBody, tone, customPrompt, userEmail } = req.body;
      const draft = await agentGeminiService.draftReply({
        originalSubject: originalSubject || 'No Subject',
        originalSender: originalSender || '',
        originalBody: originalBody || '',
        tone: tone || 'professional',
        customPrompt,
        userEmail
      });
      res.json(draft);
    } catch (error: any) {
      console.error('Error in /api/agent/draft-reply:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Natural Language Search to Gmail Query
  app.post('/api/agent/natural-search', async (req, res) => {
    try {
      const { naturalQuery } = req.body;
      if (!naturalQuery) {
        return res.status(400).json({ error: 'naturalQuery is required' });
      }
      const searchResult = await agentGeminiService.translateNaturalSearch(naturalQuery);
      res.json(searchResult);
    } catch (error: any) {
      console.error('Error in /api/agent/natural-search:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Interactive Agent Copilot Chat
  app.post('/api/agent/chat', async (req, res) => {
    try {
      const { message, history, inboxContext } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const response = await agentGeminiService.chatWithAgent({
        message,
        history: history || [],
        inboxContext
      });
      res.json(response);
    } catch (error: any) {
      console.error('Error in /api/agent/chat:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development vs Production Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gmail Mail Agent Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
