import React, { useState, useEffect, useRef } from "react";
import { toZonedTime } from "date-fns-tz";
import { marked } from "marked";
import { Icon } from "@iconify/react";

// Define interfaces
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

// ChatApp class definition
class ChatApp {
  description: any; // Changed type to any to hold JSON object
  apiKey: string;
  apiUrl: string;
  generationConfig: GenerationConfig;
  safetySettings: SafetySetting[];

  constructor() {
    this.description = null; // Initialize as null
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
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

      // Access the JSON data here
      this.accessDescriptionData();
    } catch (err) {
      console.error("Failed to load description:", err);
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
    const valeursFondamentales =
      this.description["à propos"].valeurs_fondamental;
    const chronologie = this.description["à propos"].chronologie;
    const equipe = this.description["à propos"].team;
    const coaching = this.description.services.coaching;
    const programmePivotEconomie =
      this.description.services.programme_pivot_économie;
    const aideALaGouvernance = this.description.services.aide_à_la_gouvernance;
    const redactionDuPlanDAffaires =
      this.description.services.rédaction_du_plan_d_affaires;
    const adhesion = this.description.services.adhésion;
    const publications = this.description.publications;
    const events2023 = this.description.events["2023"];
    const events2024 = this.description.events["2024"];
    const contacts = this.description.contacts;
    const telephone = this.description.contacts.phone_number;
    const adresse = this.description.contacts.address;
    const siteWeb = this.description.contacts.website;
    const reseauxSociaux = this.description.contacts.socials;
    const Facebook = this.description.contacts.socials.facebook;
    const instagram = this.description.contacts.socials.instagram;
    const linkedin = this.description.contacts.socials.linkedin;
    const YouTube = this.description.contacts.socials.youtube;

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
    console.log("Facebook:", Facebook);
    console.log("Instagram:", instagram);
    console.log("LinkedIn:", linkedin);
    console.log("YouTube:", YouTube);
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

// React component as it was previously

const ChatBotSimpleApi: React.FC = () => {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<ChatBubble[]>(
    []
  );
  const [chatApp, setChatApp] = useState<ChatApp | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [isGreetingShown, setIsGreetingShown] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Styles object
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: "fixed",
      bottom: "5%",
      right: "1%",
      width: "40vw",
      height: "80vh",
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
      position: "fixed",
      bottom: "3%",
      right: "1%",
      width: "60px",
      height: "60px",
      backgroundColor: "black",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      zIndex: 1000,
      animation: "bounce 2s ease",
    },
    notificationDot: {
      position: "absolute",
      top: "10px",
      right: "10px",
      width: "15px",
      height: "15px",
      backgroundColor: "red",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      fontSize: "12px",
    },
    header: {
      fontWeight: "bold",
      textAlign: "center",
      color: "#000",
      backgroundColor: "white",
      padding: "10px",
      borderRadius: "10px 10px 0 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logo: {
      width: "50px",
      height: "50px",
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
      display: "none", // Hide the minimize button
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
      outline: "none",
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
      textAlign: "left",
    },
    botIcon: {
      marginLeft: "10px",
      borderRadius: "50%",
      border: "2px solid #000",
      padding: "5px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
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
      position: "relative",
      width: "100%",
      height: "16px",
      marginTop: "10px",
    },
    scrollButton: {
      position: "absolute",
      left: "50%",
      bottom: "25%",
      transform: "translateX(-50%)",
      backgroundColor: "#f9f9f8",
      border: "none",
      borderRadius: "50%",
      color: "#000",
      cursor: "pointer",
      width: "30px",
      height: "30px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
    },
    minimizeRoundButton: {
      position: "absolute",
      bottom: "10px",
      right: "10px",
      backgroundColor: "black",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      zIndex: 1001,
    },
  };

  useEffect(() => {
    const app = new ChatApp();
    app.fetchDescription().then(() => {
      setChatApp(app);
      setDataLoaded(true);
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
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.id === "btn-services") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "question", text: "Parlez-moi de vos services." },
        ]);
      } else if (target.id === "btn-contact") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "question", text: "Comment puis-je vous contacter?" },
        ]);
      } else if (target.id === "btn-events") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "question", text: "Quels évènements sont à venir?" },
        ]);
      }
    };
  
    document.addEventListener("click", handleButtonClick);
  
    return () => {
      document.removeEventListener("click", handleButtonClick);
    };
  }, [messages]);
  
  useEffect(() => {
    const messagesDiv = document.getElementById("messages");
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      messagesDiv.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (messagesDiv) {
        messagesDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, [messages]);

  const handleScroll = () => {
    const messagesDiv = document.getElementById("messages");
    if (messagesDiv) {
      const isScrolledToBottom =
        messagesDiv.scrollHeight - messagesDiv.clientHeight <=
        messagesDiv.scrollTop + 1;
      setShowScrollButton(!isScrolledToBottom);
    }
  };

  const scrollToBottom = () => {
    const messagesDiv = document.getElementById("messages");
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() !== "" && dataLoaded && chatApp) {
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
    if (!isGreetingShown) {
      setMessages([
        ...messages,
        {
          type: "response",
          text: `Bienvenue chez Startop! Comment puis-je vous aider aujourd'hui?
                 <br /><button id="btn-services">Services</button>
                 <button id="btn-contact">Contact</button>
                 <button id="btn-events">Évènements</button>`,
        },
      ]);
      setIsGreetingShown(true);
    }
  };

  
      return (
  <div>
    <style>
      {`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}
    </style>
      {isMinimized ? (
        <div style={styles.containerMinimized} onClick={handleMinimize}>
          <Icon icon="uiw:message" width="30" height="30" color="white" />
          <div style={styles.notificationDot}></div>
        </div>
      ) : (
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
            <div style={styles.logo}>
                <Icon icon="fluent:bot-sparkle-24-regular" width="40" height="40" color="black" />
              </div>
              <span style={styles.headerTitle}>StarBot</span>
            </div>
          </div>
          {!isMinimized && (
            <>
              <div style={styles.messages} id="messages">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={
                      msg.type === "question"
                        ? styles.userBubble
                        : styles.botBubble
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
              <span>StarBot est en train d'écrire</span>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          )}
          {showScrollButton && (
            <button style={styles.scrollButton} onClick={scrollToBottom}>
              <Icon icon="ion:chevron-down-outline" width="26" height="26" />
            </button>
          )}
        </div>
      )}
      {!isMinimized && (
        <div style={styles.minimizeRoundButton} onClick={handleMinimize}>
          <Icon icon="mdi:chevron-down" width="24" height="24" color="white" />
        </div>
      )}
    </div>
  );
};

export default ChatBotSimpleApi;

//index.tsx 18/06/2024
