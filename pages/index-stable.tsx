import React, { useState, useEffect, useRef } from "react";
import { toZonedTime } from "date-fns-tz";
import { marked } from "marked";
import { Icon } from "@iconify/react";

// Define interfaces
interface ChatBubble {
  type: "question" | "response" | "error";
  text: string;
  label?: string; // Add label property
}

// ChatApp class definition
class ChatApp {
  description: any;
  apiKey: string;
  apiUrl: string;
  generationConfig: any;
  safetySettings: any[];

  constructor() {
    this.description = null;
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";
    this.generationConfig = {
      temperature: 0.2,
      topP: 0.9,
      topK: 64,
      maxOutputTokens: 700,
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
            text: "Le dernier évènement était COHORTE RELÈVE EN ÉCONOMIE SOCIALE, le 17 juin 2024.",
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
                " Réponds de manière amicale et invitante. Date actuelle: " +
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
              text: `Je suis votre aide Startop et je répond à toutes vos questions en lien avec Startop. Aujourd'hui est ${currentDate}. Mes réponses sont courtes et simples.`,
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
  const [showButtons, setShowButtons] = useState<boolean>(true);
  const [followUpButtons, setFollowUpButtons] = useState<{ [key: string]: string[] }>({
    "Parlez-moi de types de services offerts": ["💼Coaching", "🌱Pivot","🏛️Soutien technique", "📈Plan d’Affaires", "🌟Adhésion"],
    "Comment puis-je vous contacter?": ["Facebook", "Instagram", "LinkedIn"],
    "Quels évènements sont à venir?": ["Événements cette semaine.", "Événements ce mois-ci."],
    "Parlez-moi de membres de votre équipe.": ["Membres principaux.", "Tous les membres."],
  });
  const [currentFollowUp, setCurrentFollowUp] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Styles object
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: "fixed",
      bottom: "5%",
      right: "1%",
      width: "50vw",
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
      marginBottom: "15px",
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
    userBubble: {
      backgroundColor: "#f2b950",
      borderRadius: "10px",
      padding: "10px 15px",
      margin: "10px 0 5px", // Reduced gap
      alignSelf: "flex-end",
      maxWidth: "80%",
      textAlign: "right",
      color: "#000",
      position: "relative",
    },
    botBubble: {
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      padding: "10px 15px",
      margin: "10px 0 5px", // Reduced gap
      alignSelf: "flex-start",
      maxWidth: "80%",
      color: "#000000",
      textAlign: "left",
      position: "relative",
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
    buttonsContainer: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: "10px",
      position: `relative`,
      bottom: `10px`,
      width: `100%`,
      padding: `0 10px`,
      backgroundColor: `transparent`,
    },
    chatButton: {
      margin: "5px",
      padding: "10px 15px",
      border: "1px solid #000",
      borderRadius: "20px",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: "14px",
    },
    userLabel: {
      fontWeight: "bold",
      fontSize: "14px",
      marginBottom: "1px", // Reduced gap
    },
    botLabel: {
      fontWeight: "bold",
      fontSize: "14px",
      marginBottom: "1px", // Reduced gap
    },
    messageContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      position: "relative",
      marginBottom: "20px",
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      fontSize: "14px",
      color: "#888",
    },
    link: {
      color: "#1a73e8",
      textDecoration: "none",
    },
  };

  useEffect(() => {
    console.log("Initial Messages State:", messages); // Log initial state
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
    const handleButtonClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let message = "";

      if (target.id === "btn-services") {
        message = "Parlez-moi de types de services offerts";
      } else if (target.id === "btn-contact") {
        message = "Comment puis-je vous contacter?";
      } else if (target.id === "btn-events") {
        message = "Quels évènements sont à venir?";
      } else if (target.id === "btn-team") {
        message = "Parlez-moi de membres de votre équipe.";
      } else if (target.className === "follow-up-button") {
        message = target.innerText;
      }

      if (message && chatApp) {
        setShowButtons(false);

        const newUserMessage: ChatBubble = { type: "question", text: message };

        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setConversationHistory((prevHistory) => [
          ...prevHistory,
          newUserMessage,
        ]);

        const responseText = await chatApp.sendMessage(message, [
          ...conversationHistory,
          newUserMessage,
        ]);
        const newBotMessage: ChatBubble = {
          type: "response",
          text: responseText,
          label: "StarBot", // Ensure label is added for responses
        };

        setMessages((prevMessages) => [...prevMessages, newBotMessage]);
        setConversationHistory((prevHistory) => [
          ...prevHistory,
          newBotMessage,
        ]);

        // Show follow-up buttons if available
        if (followUpButtons[message]) {
          setCurrentFollowUp(followUpButtons[message]);
        } else {
          setCurrentFollowUp([]);
        }
      }
    };

    document.addEventListener("click", handleButtonClick);

    return () => {
      document.removeEventListener("click", handleButtonClick);
    };
  }, [messages, chatApp, conversationHistory]);

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
          label: "StarBot", // Add the label here for responses
        };

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, newBotMessage];
          console.log("Updated Messages after bot response:", updatedMessages); // Log the updated messages
          return updatedMessages;
        });
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
      const greetingMessages: ChatBubble[] = [
        {
          type: "response",
          text: "Bienvenue chez Startop! Je suis StarBot, votre assistant virtuel.",
          label: "StarBot",
        },
        {
          type: "response",
          text: "Comment puis-je vous aider aujourd'hui?",
          label: "StarBot",
        },
      ];

      greetingMessages.forEach((msg, index) => {
        setTimeout(() => {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages, msg];
            console.log("Updated Messages:", newMessages); // Log the updated messages
            return newMessages;
          });
        }, index * 1000); // Adjust the delay as needed
      });

      setIsGreetingShown(true);
    }
  };

  const renderFollowUpButtons = () => {
    if (currentFollowUp.length === 0) return null;

    return (
      <div style={styles.buttonsContainer}>
        {currentFollowUp.map((btnText, index) => (
          <button
            key={index}
            className="follow-up-button"
            style={styles.chatButton}
          >
            {btnText}
          </button>
        ))}
      </div>
    );
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
                <Icon
                  icon="fluent:bot-sparkle-24-regular"
                  width="40"
                  height="40"
                  color="black"
                />
              </div>
              <span style={styles.headerTitle}>StarBot</span>
            </div>
          </div>
          {!isMinimized && (
            <>
              <div style={styles.messages} id="messages">
                {messages.map((msg, index) => {
                  console.log("Rendering message:", msg); // Log each message being rendered
                  return (
                    <div
                      key={index}
                      style={{
                        ...styles.messageContainer,
                        alignItems:
                          msg.type === "question" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={
                          msg.type === "question"
                            ? styles.userLabel
                            : styles.botLabel
                        }
                      >
                        {msg.label ||
                          (msg.type === "question" ? "Vous" : "StarBot")}
                      </div>
                      <div
                        style={
                          msg.type === "question"
                            ? styles.userBubble
                            : styles.botBubble
                        }
                        dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                      />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {showButtons && (
                <div style={styles.buttonsContainer}>
                  <button id="btn-services" style={styles.chatButton}>
                    Services
                  </button>
                  <button id="btn-contact" style={styles.chatButton}>
                    Contact
                  </button>
                  <button id="btn-events" style={styles.chatButton}>
                    Évènements
                  </button>
                  <button id="btn-team" style={styles.chatButton}>
                    Équipe
                  </button>
                </div>
              )}
              {renderFollowUpButtons()}
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
              <div style={styles.footer}>
                Powered by{" "}
                <a href="https://gemini.google.com/" style={styles.link}>
                  Google Gemini 1.5 Pro
                </a>
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

//index.tsx 26/06/2024
