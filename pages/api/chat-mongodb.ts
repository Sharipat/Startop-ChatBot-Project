// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { toZonedTime } from 'date-fns-tz';
import { marked } from 'marked'; // Import marked
import { promises as fs } from 'fs';


// Connection URI
const uri = process.env.NEXT_PUBLIC_MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Cache the database connection
let cachedDb: any = null;

// Function to connect to the database
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db('startop'); // Replace with your database name
    cachedDb = db;
    return db;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// Define interface for ChatBubble
interface ChatBubble {
  type: 'question' | 'response' | 'error';
  text: string;
}

// ChatApp class 
class ChatApp {
  description: string;
  apiKey: string;
  apiUrl: string;
  generationConfig: any;
  safetySettings: any[];
  parsedDescription: any;

  constructor() {
    this.description = '';
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';
    this.generationConfig = {
      temperature: 0.1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };
    this.safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];
    this.parsedDescription = {};
  }

  async fetchDescription(): Promise<void> {
    try {
      // Read the description.txt file using fs.readFile
      const fileContents = await fs.readFile('public/description.txt', 'utf-8');
      this.description = fileContents; 
      console.log('Description loaded:', this.description);
    } catch (err) {
      console.error('Failed to load description:', err);
    }
  }

  escapeString(str: string): string {
    if (typeof str === 'undefined' || str === null) {
      return ''; // Return an empty string if str is undefined or null
    }
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/'/g, "\\'")
              .replace(/\n/g, '')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
  }

  async sendMessage(inputText: string, conversationHistory: ChatBubble[]): Promise<string> {
    try {
      const db = await connectToDatabase(); 
  
      const escapedDescription = this.escapeString(this.description);
      const escapedInputText = this.escapeString(inputText);
      const escapedHistory = conversationHistory.map(bubble => ({
        ...bubble,
        text: this.escapeString(bubble.text)
      }));
      const nowUtc = new Date();
  
      const currentDate = toZonedTime(nowUtc, 'America/New_York');
  
      // 1. Dynamically get category names from parsed JSON
      const categoryNames = Object.keys(this.parsedDescription);
  
      // 2. Find the relevant category based on user input
      const relevantCategory = categoryNames.find(category => 
        inputText.toLowerCase().includes(category.toLowerCase()) 
      );
  
      let prompt = escapedDescription + 
                   " Je réponds avec une courte description, réponse très simple et courte seulement. " +
                   "Date actuelle: " + currentDate + " " +
                   "**Instructions:**  " +
                   "Réponds à mes questions sur les événements et les dates de Startop de manière concise et informative. " +
                   "Lorsque tu fournis des informations sur des dates, assure-toi que tes réponses sont pertinentes à l’heure actuelle.  " + 
                   "Si tu dois mentionner une date passée, utilise la phrase 'cet événement a eu lieu le [Date]'. ";
  
      // 3.  Include relevant category data in the prompt
      if (relevantCategory) {
        const categoryData = this.parsedDescription[relevantCategory];
        const escapedCategoryData = this.escapeString(JSON.stringify(categoryData));
        prompt += ` Voici des informations sur ${relevantCategory}: ${escapedCategoryData}.`;
      }
  
      // ... (Rest of the requestBody and API call logic)
      const requestBody = {
        contents: [
          { role: "user", parts: [{ text: prompt }] },
          { role: "model", parts: [{ text: `Je suis votre aide Startop et je répond à toutes vos questions en lien avec Startop. Aujourd'hui est ${currentDate}. Je réponds en une phrase seulement avec une courte description, mes réponses sont très courtes et simples.`}] },
          ...escapedHistory.map(bubble => ({
            role: bubble.type === 'question' ? "user" : "model",
            parts: [{ text: bubble.text }]
          })),
          { role: "user", parts: [{ text: escapedInputText }] },
        ],
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
      };
  
      try {
        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
  
        // ... (Rest of the API response handling logic)
      } catch (error) {
        // ... (Error handling)
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return 'Erreur de connexion à la base de données. Veuillez réessayer plus tard.';
    }
  }
}

// API route handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const db = await connectToDatabase();
      const { inputText, conversationHistory } = req.body;

      const chatApp = new ChatApp();
      await chatApp.fetchDescription(); // Fetch the description

      const responseText = await chatApp.sendMessage(inputText, conversationHistory);

      res.status(200).json({ responseText }); // Send the response
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'There was an error processing your request.' });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

// chat.ts for handling chat messages in Next.js for the chatbot with MongoDB