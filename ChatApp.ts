import { toZonedTime } from "date-fns-tz";

export interface ChatBubble {
  type: "question" | "response" | "error";
  text: string;
  label?: string;
}

class ChatApp {
  description: any;
  apiKey: string;
  apiUrl: string;
  generationConfig: any;
  safetySettings: any[];

  constructor() {
    this.description = null;
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY as string;
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";
    this.generationConfig = {
      temperature: 0.1,
      topP: 0.9,
      topK: 64,
      maxOutputTokens: 1000,
      responseMimeType: "text/plain",
    };
    this.safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];
  }

  async fetchDescription(): Promise<void> {
    try {
      const response = await fetch("/description-eng.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      this.description = json;
      console.log("Description loaded:", this.description);
    } catch (err) {
      console.error("Failed to load description:", err);
    }
  }

  escapeString(str: string): string {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }

  async sendMessage(
    inputText: string,
    conversationHistory: ChatBubble[]
  ): Promise<string> {
    const escapedDescription = this.escapeString(
      JSON.stringify(this.description)
    );
    const escapedInputText = this.escapeString(inputText);
    const escapedHistory = conversationHistory.map((bubble) => ({
      ...bubble,
      text: this.escapeString(bubble.text),
    }));
    const nowUtc = new Date();
    const currentDate = toZonedTime(nowUtc, "America/New_York");

    const historyGemini = [
      {
        role: "user",
        parts: [{ text: "quel est le dernier évènement de mai" }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Le dernier évènement de mai était SÉANCE D’INFORMATIONS AU PROGRAMME : COHORTE RELÈVE EN ÉCONOMIE SOCIALE, le 24 mai 2024.",
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: "quel est le dernier évènement" }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Le dernier évènement était L’ENTREPRENEURIAT COLLECTIF FÉMININ le 13 juin 2024.",
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: "Quel date sommes-nous ?" }],
      },
      {
        role: "model",
        parts: [{ text: "Aujourd'hui, nous sommes le " + currentDate + "." }],
      },
    ];
    const requestBody = {
      contents: [
        ...historyGemini,
        {
          role: "user",
          parts: [
            {
              text:
                escapedDescription +
                " Je réponds avec une courte description, réponse très simple et courte seulement. Date actuelle: " +
                currentDate +
                " " +
                "**Instructions:**  Réponds à mes questions sur les évènements et les dates de Startop de manière concise et informative. Lorsque tu fournis des informations sur des dates, assure-toi que tes réponses sont pertinentes à l’heure actuelle. ",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: `Je suis votre aide Startop et je répond à toutes vos questions en lien avec Startop. Aujourd'hui est ${currentDate}. Je réponds en une phrase seulement avec une courte description, mes réponses sont très courtes et simples.`,
            },
          ],
        },
        ...escapedHistory.map((bubble) => ({
          role: bubble.type === "question" ? "user" : "model",
          parts: [{ text: bubble.text }],
        })),
        { role: "user", parts: [{ text: escapedInputText }] },
      ],
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings,
    };

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error("Invalid API response structure");
      }

      const responseText = data.candidates[0].content.parts
        .map((part: any) => part.text)
        .join(" ");
      return responseText;
    } catch (error) {
      console.error("Error:", error);
      return "Il y a eu un problème de connexion au chatbot. Veuillez réessayer plus tard.";
    }
  }
}

export default ChatApp;
