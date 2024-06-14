import React, { useEffect, useRef, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { marked } from "marked";
import { Icon } from "@iconify/react";
import logo from "../public/logo_startop.png";

interface ChatBubble {
  type: "question" | "response" | "error";
  text: string;
}
interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseMimeType: string;
}

interface SafetySetting {
  category: string;
  threshold: string;
}
class ChatApp {
  description: any; // Changed type to any to hold JSON object
  apiKey: string;
  apiUrl: string;
  generationConfig: GenerationConfig;
  safetySettings: SafetySetting[];

  constructor() {
    this.description = null; // Initialize as null
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.generationConfig = {
      temperature: 0.1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 200,
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
      const response = await fetch('/description-eng.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      this.description = json;
      console.log('Description loaded:', this.description);

      // Access the JSON data here
      this.accessDescriptionData();
    } catch (err) {
      console.error('Failed to load description:', err);
    }
  }

  accessDescriptionData(): void {
    if (!this.description) {
      console.error("Description data not loaded");
      return;
    }

    const examples = this.description.examples;
    const mission = this.description["à propos"].mission;
    const vision = this.description["à propos"].vision;
    const valeursFondamentales = this.description["à propos"].valeurs_fondamentales;
    const chronologie = this.description["à propos"].chronologie;
    const equipe = this.description.équipe;
    const services = this.description.services;
    const coaching = this.description.services.coaching;
    const programmePivotEconomie = this.description.services.programme_pivot_économie;
    const aideALaGouvernance = this.description.services.aide_à_la_gouvernance;
    const redactionDuPlanDAffaires = this.description.services.rédaction_du_plan_d_affaires;
    const adhesion = this.description.services.adhésion;
    const publications = this.description.publications;
    const events2023 = this.description.evenements["2023"];
    const events2024 = this.description.evenements["2024"];
    const contacts = this.description.contacts;
    const telephone = this.description.contacts.téléphone;
    const adresse = this.description.contacts.adresse;
    const siteWeb = this.description.contacts["site-web"];
    const reseauxSociaux = this.description.contacts.réseaux_sociaux;
    const facebook = this.description.contacts.réseaux_sociaux.Facebook;
    const instagram = this.description.contacts.réseaux_sociaux.instagram;
    const linkedin = this.description.contacts.réseaux_sociaux.linkedin;
    const youtube = this.description.contacts.réseaux_sociaux.YouTube;

    console.log("Examples:", examples);
    console.log("Mission:", mission);
    console.log("Vision:", vision);
    console.log("Valeurs Fondamentales:", valeursFondamentales);
    console.log("Chronologie:", chronologie);
    console.log("Équipe:", equipe);
    console.log("Coaching Service:", coaching);
    console.log("Programme Pivot Économie:", programmePivotEconomie);
    console.log("Aide à la Gouvernance:", aideALaGouvernance);
    console.log("Rédaction du Plan d'Affaires:", redactionDuPlanDAffaires);
    console.log("Adhésion:", adhesion);
    console.log("Publications:", publications);
    console.log("Events 2023:", events2023);
    console.log("Events 2024:", events2024);
    console.log("Contacts:", contacts);
    console.log("Téléphone:", telephone);
    console.log("Adresse:", adresse);
    console.log("Site Web:", siteWeb);
    console.log("Réseaux Sociaux:", reseauxSociaux);
    console.log("Facebook:", facebook);
    console.log("Instagram:", instagram);
    console.log("LinkedIn:", linkedin);
    console.log("YouTube:", youtube);
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

  async sendMessage(inputText: string, conversationHistory: ChatBubble[]): Promise<string> {
    const escapedDescription = this.escapeString(JSON.stringify(this.description));
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
          parts: [
            { text: "quel est le dernier évènement" },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Le dernier évènement était L’ENTREPRENEURIAT COLLECTIF FÉMININ le 13 juin 2024." },
          ],
        },
        {
          role: "user",
          parts: [
            { text: "Quel date sommes-nous ?" },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Aujourd'hui, nous sommes le " + currentDate + "." },
          ],
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
                "**Instructions:**  Réponds à mes questions sur les événements et les dates de Startop de manière concise et informative. Lorsque tu fournis des informations sur des dates, assure-toi que tes réponses sont pertinentes à l’heure actuelle. ",
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

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
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

// React component as it was previously

const ChatBotSimpleApi: React.FC = () => {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<ChatBubble[]>([]);
  const [chatApp, setChatApp] = useState<ChatApp | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: "fixed",
      bottom: "5%",
      right: "3%",
      width: "40vw",
      height: "70vh",
      backgroundColor: "#f1f4f6",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      borderRadius: "10px",
      border: "1px solid #ccc",
      padding: "10px",
      zIndex: 1000,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
    },
    containerMinimized: {
      width: "230px",
      height: "90px",
      overflow: "hidden",
    },
    header: {
      fontWeight: "bold",
      textAlign: "center",
      color: "#000",
      backgroundColor: "transparent",
      padding: "10px",
      borderRadius: "10px 10px 0 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logo: {
      width: "60px",
      height: "60px",
      marginRight: "15px",
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    headerTitle: {
      textAlign: "left",
      flexGrow: 1,
      fontSize: "25px",
      fontStyle: "normal",
    },
    minimizeButton: {
      backgroundColor: "transparent",
      border: "none",
      color: "white",
      cursor: "pointer",
      fontSize: "20px",
      lineHeight: "20px",
    },
    messages: {
      flex: 1,
      overflowY: "auto",
      display: "flex",
      maxHeight: "70%",
      flexDirection: "column",
      paddingRight: "15px",
      paddingBottom: "10px",
    },
    inputContainer: {
      display: "flex",
      marginTop: "auto",
      marginBottom: "15px",
    },
    inputWrapper: {
      display: "flex",
      alignItems: "center",
      borderRadius: "15px",
      border: "1px solid #ccc",
      padding: "5px",
    },
    input: {
      flex: 1,
      padding: "5px",
      border: "1px solid transparent",
      borderRadius: "15px 0 0 15px",
      fontSize: "18px",
    },
    button: {
      padding: "10px",
      border: "none",
      backgroundColor: "#fff",
      color: "#000",
      borderRadius: "0 15px 15px 0",
      cursor: "pointer",
      fontSize: "16px",
    },
    buttonHover: {
      backgroundColor: "#E65B53",
    },
    userBubble: {
      backgroundColor: "#f2b950",
      borderRadius: "10px",
      padding: "2px 5px",
      margin: "10px 0",
      alignSelf: "flex-end",
      maxWidth: "80%",
      textAlign: "right",
      color: "#000",
    },
    botBubble: {
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      padding: "2px 5px",
      margin: "10px 0",
      alignSelf: "flex-start",
      maxWidth: "80%",
      color: "#000000",
    },
    resizeHandle: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "10px",
      height: "10px",
      backgroundColor: "#FFFFFF",
      cursor: "nwse-resize",
      zIndex: 1001,
      borderTopLeftRadius: "8px",
    },
    typingIndicator: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "10px",
      color: "#000",
      fontSize: "16px",
      fontWeight: "bold",
      position: "relative",
      width: "100%",
      height: "16px",
      marginTop: "10px",
    },
  };

  useEffect(() => {
    const app = new ChatApp();
    app.fetchDescription().then(() => {
      setChatApp(app);
    });

    document.body.style.backgroundImage = "url(/startopcapture.png)";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.height = "100vh";
    document.body.style.margin = "0";
    document.body.style.fontFamily = "Lato, sans-serif";

    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.height = "";
      document.body.style.margin = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  useEffect(() => {
    const messagesDiv = document.getElementById("messages");
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() !== "") {
      const newUserMessage: ChatBubble = { type: "question", text: inputValue };

      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setConversationHistory((prevHistory) => [...prevHistory, newUserMessage]);

      setInputValue("");

      if (chatApp) {
        setIsTyping(true);

        const responseText = await chatApp.sendMessage(inputValue, [
          ...conversationHistory,
          newUserMessage,
        ]);
        const newBotMessage: ChatBubble = {
          type: "response",
          text: responseText,
        };

        setMessages((prevMessages) => [...prevMessages, newBotMessage]);
        setConversationHistory((prevHistory) => [
          ...prevHistory,
          newBotMessage,
        ]);

        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setInputValue(inputValue + "\n");
    }
  };

  const renderMarkdown = (text: string) => {
    const formattedText = text.replace(/(\n|^)(\* )/g, "$1\n$2");
    const html = marked(formattedText);
    return { __html: html };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    const resizeHandle = resizeHandleRef.current;
    if (container && resizeHandle && e.target === resizeHandle) {
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = container.offsetWidth;
      const startHeight = container.offsetHeight;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (startX - e.clientX);
        const newHeight = startHeight + (startY - e.clientY);
        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.container,
        ...(isMinimized ? styles.containerMinimized : {}),
      }}
    >
      {!isMinimized && (
        <div
          ref={resizeHandleRef}
          style={styles.resizeHandle}
          onMouseDown={handleMouseDown}
        ></div>
      )}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src={logo.src} alt="Startop Logo" style={styles.logo} />
          <span style={styles.headerTitle}></span>
        </div>
        <button onClick={handleMinimize} style={styles.minimizeButton}>
          {isMinimized ? "➕" : "➖"}
        </button>
      </div>
      {!isMinimized && (
        <>
          <div style={styles.messages} id="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                style={
                  msg.type === "question" ? styles.userBubble : styles.botBubble
                }
                dangerouslySetInnerHTML={renderMarkdown(msg.text)}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>
          <div style={styles.inputContainer}>
            <input
              type="text"
              id="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Entrez votre message ici"
              style={styles.input}
              maxLength={250}
            />
            <button onClick={handleSendMessage} style={styles.button}>
              <Icon icon="ion:send-sharp" width="26" height="26" />
            </button>
          </div>
        </>
      )}
      {isTyping && (
        <div style={styles.typingIndicator}>
          <span>L’assistant virtuel Startop est en train d'écrire...</span>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      )}
    </div>
  );
};

export default ChatBotSimpleApi;
//index.tsx version with the ChatBotSimpleApi component and the ChatApp class that fetches the description.json file and logs the data to the console
// added historyGemini array to access the JSON data
