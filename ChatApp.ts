import { toZonedTime } from "date-fns-tz";

export interface ChatBubble {
  type: "question" | "response" | "error" | "system";
  text: string;
  label?: string;
}

interface Service {
  type: string;
  description: string;
  price: string;
  emoji: string;
}

class ChatApp {
  description: any;
  apiKey: string;
  apiUrl: string;
  generationConfig: any;
  safetySettings: any[];

  private conversationHistory: ChatBubble[] = [];

  constructor() {
    this.description = null;
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY as string;
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";
    this.generationConfig = {
      temperature: 0.3,
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

    // Check for updates in JSON data every 3 hours
    setInterval(() => {
      this.fetchDescription();
    }, 3 * 60 * 60 * 1000);
  }
  private initializeConversation() {
    const currentDate = toZonedTime(new Date(), 'America/New_York');
    const escapedDescription = this.escapeString(JSON.stringify(this.description));

    const systemMessage: ChatBubble = {
      type: 'system',
      text: `${escapedDescription} Réponds de manière amicale et invitante. Ajoute des questions de suivi pour maintenir le flux de la conversation. Date actuelle: ${currentDate}.
    
      **Instructions:**
      - Tu es StarBot, l'assistant virtuel de Startop.
      - Ta mission est d'aider les utilisateurs à en savoir plus sur Startop, ses services, ses événements, son équipe, et ses publications. 
      - Réponds à mes questions sur les services, les événements, les membres de l'équipe, les publications et les méthodes de contact de Startop. 
      - Fournis des réponses concises mais incluant des détails spécifiques (prix des services, dates des événements, liens vers des ressources, rôles des membres de l'équipe, descriptions des publications).
      - Pose des questions de suivi pour guider la conversation et approfondir les besoins de l'utilisateur.
    
      **Informations spécifiques à connaître :**
      - **Mission de Startop:** ${this.description.about.mission}
      - **Valeurs de Startop:** ${this.description.about.values.map(value => `- ${value}`).join('\n')} 
    
      - **Membres de l'équipe:** 
        ${this.description.about.team.map(member => `  - **${member.name}:** ${member.role}`).join('\n')}
      - **Si l'utilisateur demande des informations sur un membre de l'équipe, fournis son rôle et une brève description de son travail chez Startop.**
    
      - **Si l'utilisateur demande des publications, fournis le titre, la date et une brève description de la publication.**
    
      - **Si l'utilisateur demande des événements passés, assure-toi de mentionner qu'ils ont déjà eu lieu.**
      - **Pour trouver le dernier événement passé, utilise l'ID stocké dans le champ "lastEvent".**
      - **Si l'utilisateur demande des événements futurs et qu'il n'y en a pas de prévus, suggère de consulter régulièrement le site web ou les réseaux sociaux pour les mises à jour.**
      - **N'oublie pas de mentionner les liens vers les réseaux sociaux de Startop si l'utilisateur demande des informations de contact.**
    
      - Si tu ne comprends pas l'entrée de l'utilisateur, demande-lui de reformuler sa question de manière plus précise en donnant des exemples comme :
          - 'Quelle est la mission de Startop ?' 
          - 'Peux-tu me dire un fait amusant à propos de Startop ?'
          - 'Quels services proposez-vous ?'
          - 'Qui est Mariam Coulibaly ?'
          - 'Parlez-moi de vos événements.'
    
      - Si l'utilisateur commence la conversation en français ou utilise les boutons de message français, réponds en français. Si l'utilisateur mélange le français et l'anglais, continue la conversation en français. 
      `
    };

    this.conversationHistory.push(systemMessage);
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
      console.log("Events loaded:", this.description.events);
    } catch (err) {
      console.error("Failed to load description:", err);
    }
    this.initializeConversation();

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

  getServices(): string[] {
    if (this.description && this.description.services) {
      return Object.values(this.description.services).map(
        (service: Service) => `• ${service.emoji} ${service.type}`
      );
    }
    return [];
  }

  getServiceDetails(emoji: string): Service | undefined {
    if (this.description && this.description.services) {
      return (Object.values(this.description.services) as Service[]).find(
        (service) => service.emoji === emoji
      );
    }
    return undefined;
  }

  getContactInfo(method: string): string {
    if (this.description && this.description.contacts) {
      const contactInfo = this.description.contacts[method];
      return contactInfo ? `${method}: ${contactInfo}` : "Méthode de contact non disponible.";
    }
    return "Les informations de contact ne sont pas disponibles.";
  }

  getSocialLink(network: string): string | undefined {
    if (this.description && this.description.contacts && this.description.contacts.socials) {
      return this.description.contacts.socials[network.toLowerCase()];
    }
    return undefined;
  }

  async sendMessage(inputText: string): Promise<string> { 
    const escapedInputText = this.escapeString(inputText);
    const newUserMessage: ChatBubble = { 
      type: 'question', 
      text: escapedInputText 
    };

    this.conversationHistory.push(newUserMessage); // Add the new user message to history 

    const nowUtc = new Date();
    const currentDate = toZonedTime(nowUtc, 'America/New_York'); 

    const requestBody = {
      contents: [
        ...this.conversationHistory.map((bubble) => ({ // Use the conversation history
          role: bubble.type === 'question' || bubble.type === 'system' ? 'user' : 'model', 
          parts: [{ text: bubble.text }],
        })),
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

      let responseText = data.candidates[0].content.parts
        .map((part: any) => part.text)
        .join(" ");

      // Post-process to make the response more conversational and friendly
      const formattedResponse = responseText
        .replace(/\b(Startop|service)\b/g, (match) =>
          match === "Startop" ? "Startop" : "service"
        );

        this.conversationHistory.push({ 
          type: 'response', 
          text: formattedResponse,
          label: 'StarBot'
        });

      return formattedResponse;
    } catch (error) {
      console.error("Error:", error);
      return "Il y a eu un problème de connexion au chatbot. Veuillez réessayer plus tard.";
    }
  }
  public addToConversationHistory(message: ChatBubble) {
    this.conversationHistory.push(message);
  }

  isEventRelatedQuestion(inputText: string): boolean {
    const eventKeywords = ['événement', 'évènement', 'evenement', 'event', 'prochain', 'futur', 'calendrier', 'agenda', 'programme', 'dernier', 'passé', 'récent', 'session'];
    return eventKeywords.some(keyword => inputText.toLowerCase().includes(keyword));
  }

  isPastEventQuestion(inputText: string): boolean {
    const pastEventKeywords = ['dernier', 'passé', 'récent', 'précédent', 'last', 'past', 'recent'];
    return pastEventKeywords.some(keyword => inputText.toLowerCase().includes(keyword));
  }

  getServiceFollowUp(): string {
    return "Puis-je vous aider avec autre chose? Oui, SVP ou Non, merci";
  }

  getEventOptions(): string {
    return "Quel évènement vous intéresse? Prochain évènement, Dernier évènement, Autre";
  }

  getSocialMediaOptions(): string {
    return "Quel réseau social voulez-vous connaître? Facebook, Instagram, LinkedIn, YouTube";
  }
}

export default ChatApp;
