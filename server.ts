import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import twilio from "twilio";
import { AccessToken } from "livekit-server-sdk";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI Chatbot route
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Gemini API key is missing. Please configure it in your Secrets panel in the Settings menu." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are "Astha Copilot", the smart virtual assistant of "Astha Twin Towers", an premium dual-tower luxury high-rise condominium complex located in Khetasar, Cumilla, Bangladesh.
Your goal is to assist residents, visitors, potential buyers, and guests with helpful information about the community, amenities, safety, and digital operations.
Key highlights of Astha Twin Towers:
- Dual Tower architecture (Block A & Block B), 72 premium residential apartments, 48 spacious underground bays.
- Earthquake safety withstands up to 7.8 Richter scale, modern rooftop gardens, 3 luxury glass capsule lifts, 24/7 CCTV vigilance, backup generator 550 KVA, and solar power array.
- Run by the Management Board consisting of Chairman Alhaj Md. Abdur Rahman, President Engr. Rafiqul Islam, and Secretary Dr. Adnan Chowdhury.
- High-tech digital app with automatic ledger systems, bilingual notifications, notice boards, visitor logs, and official complaints portals.

Please respond extremely politely, professionally, clearly, and helpful (maximum 150 words). Support both English and Bengali conversation with excellent etiquette. Translate and welcome visitors matching the tone of your language.`;

      // Structure conversation payloads
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((turn: { role: string; text: string }) => {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash"
      ];
      let response;
      let lastError;

      for (const model of modelsToTry) {
        let retries = 3;
        let delayMs = 2000;
        let success = false;

        while (retries > 0) {
          try {
            response = await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
                temperature: 0.7,
              }
            });
            success = true;
            break; // Success
          } catch (error: any) {
            lastError = error;
            retries--;
            const isOverloaded = error.status === 503 || error.status === 429 ||
              (error.message && (error.message.includes('503') || error.message.includes('429') || error.message.includes('high demand') || error.message.includes('quota')));
              
            if (!isOverloaded || retries === 0) {
              break; // Give up on this model, go to next model or fail
            }
            
            console.warn(`Gemini API overloaded/rate-limited for model ${model}. Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2.5; // Exponential backoff
          }
        }

        if (success) {
          break; // Stop trying other models
        } else {
          console.warn(`Falling back from model ${model} due to errors:`, lastError?.message || lastError);
        }
      }

      if (!response) {
        throw lastError || new Error("All fallback models failed.");
      }

      res.json({ text: response.text || "No response generated." });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      const isOverloaded = error.status === 503 || 
        (error.message && (error.message.includes('503') || error.message.includes('high demand')));
        
      if (isOverloaded) {
        res.status(503).json({ error: "Astha Copilot is currently experiencing exceptionally high demand. Please try again in a few moments." });
      } else {
        res.status(500).json({ error: error.message || "Failed to process chat with GenAI." });
      }
    }
  });

  // LiveKit Token Route
  app.post("/api/livekit/token", async (req, res) => {
    const { roomName, participantName, isCommitteeOrAdmin } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: "Room name and participant name are required" });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ 
        error: "LiveKit credentials not configured. Please set them in Environment Variables." 
      });
    }

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        name: participantName,
      });
      
      // Add room permissions
      at.addGrant({ 
        roomJoin: true, 
        room: roomName,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true 
      });

      const token = await at.toJwt();
      res.json({ token });
    } catch (error: any) {
      console.error("LiveKit Token Error:", error);
      res.status(500).json({ error: "Failed to generate voice token." });
    }
  });

  // API constraints check
  app.post("/api/send-sms", async (req, res) => {
    const { to, message } = req.body;

    // Check configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      return res.status(500).json({ 
        error: "Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables." 
      });
    }

    if (!to || !message) {
      return res.status(400).json({
        error: "Missing 'to' or 'message' in request body."
      });
    }

    try {
      const client = twilio(accountSid, authToken);
      const toNumbers = Array.isArray(to) ? to : [to];
      
      const sentMessages = [];
      const errors = [];

      for (const number of toNumbers) {
        try {
          const result = await client.messages.create({
            body: message,
            from: fromPhone,
            to: number,
          });
          sentMessages.push(result.sid);
        } catch (err: any) {
          errors.push({ number, error: err.message || JSON.stringify(err) });
        }
      }

      res.json({ success: true, sent: sentMessages, errors });
    } catch (error: any) {
      console.error("SMS Error:", error);
      res.status(500).json({ error: "Failed to initialize SMS client or send messages." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
