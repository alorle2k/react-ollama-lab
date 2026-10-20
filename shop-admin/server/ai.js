import { createServer } from 'node:http';

const PORT = 3002;

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST' || req.url !== '/api/assistant') {
    res.writeHead(404);
    return res.end('Not found');
  }

  try {
    let body = '';
    for await (const chunk of req) body += chunk;

    const { question } = JSON.parse(body);

    if (typeof question !== 'string' || !question.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Enter a question.' }));
    }

    const apiKey = process.env.OLLAMA_API_KEY;

    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Configure your Ollama Cloud API key on the backend first.'
      }));
    }

    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-oss:20b-cloud',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful e-commerce store administration assistant. Give practical, concise advice about product management, pricing, inventory, and catalog organization. Do not claim to have changed products in the database.'
          },
          { role: 'user', content: question.trim() }
        ],
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: data.error || 'The AI service returned an error.'
      }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ answer: data.message?.content || 'No response received.' }));
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unable to contact the AI service.' }));
  }
}).listen(PORT, () => {
  console.log(`AI backend running at http://localhost:${PORT}`);
});
