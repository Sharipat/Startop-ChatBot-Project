import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import ChatApp, { ChatBubble } from './ChatApp';
import Header from './components/Header';
import Messages from './components/Messages';
import InputArea from './components/InputArea';
import Footer from './components/Footer';
import styles from './styles/ChatBotStyles.module.css';

const ChatBotSimpleApi: React.FC = () => {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatBubble[]>([]);
  const [chatApp, setChatApp] = useState<ChatApp | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [isGreetingShown, setIsGreetingShown] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [showButtons, setShowButtons] = useState<boolean>(true);
  const [showServiceButtons, setShowServiceButtons] = useState<boolean>(false);
  const [showContactOptions, setShowContactOptions] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

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
    const handleButtonClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let message = "";

      if (target.id === "btn-services") {
        if (chatApp) {
          const services = chatApp.getServices();
          const formattedServices = services.join("\n");
          message = `Voici nos services:\n${formattedServices}\nQuel service souhaitez-vous connaître?`;
          setShowServiceButtons(true);
        }
      } else if (target.id === "btn-contact") {
        message = "Il y a plusieurs façons de contacter Startop. Laquelle choisissez-vous ?";
        setShowContactOptions(true);
        setShowButtons(false);
      } else if (target.dataset.service) {
        const serviceEmoji = target.dataset.service;
        if (chatApp) {
          const service = chatApp.getServiceDetails(serviceEmoji);
          if (service) {
            message = `${service.type}: ${service.description} Coût: ${service.price}`;
            setShowServiceButtons(false);
          }
        }
      } else if (target.dataset.contactMethod) {
        if (chatApp) {
          const method = target.dataset.contactMethod;
          const contactInfo = chatApp.getContactInfo(method);
          message = contactInfo;
          setShowContactOptions(false);
        }
      }

      if (message && chatApp) {
        const newBotMessage: ChatBubble = { type: "response", text: message, label: "StarBot" };

        setMessages((prevMessages) => [...prevMessages, newBotMessage]);
        setConversationHistory((prevHistory) => [
          ...prevHistory,
          newBotMessage,
        ]);
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

  const handleSendMessage = async (inputValue: string) => {
    if (inputValue.trim() !== "" && dataLoaded && chatApp) {
      const newUserMessage: ChatBubble = { type: "question", text: inputValue };

      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setConversationHistory((prevHistory) => [...prevHistory, newUserMessage]);

      if (chatApp) {
        setIsTyping(true);

        const responseText = await chatApp.sendMessage(inputValue, [
          ...conversationHistory,
          newUserMessage,
        ]);
        const newBotMessage: ChatBubble = {
          type: "response",
          text: responseText,
          label: "StarBot"
        };

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, newBotMessage];
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
        { type: "response", text: "Bienvenue chez Startop!", label: "StarBot" },
        { type: "response", text: "Comment puis-je vous aider aujourd'hui?", label: "StarBot" },
      ];

      greetingMessages.forEach((msg, index) => {
        setTimeout(() => {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages, msg];
            return newMessages;
          });
        }, index * 1000); // Adjust the delay as needed
      });

      setIsGreetingShown(true);
    }
  };

  return (
    <div>
      <style jsx>{`
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
        <div className={styles.containerMinimized} onClick={handleMinimize}>
          <Icon icon="uiw:message" width="30" height="30" color="white" />
          <div className={styles.notificationDot}></div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={styles.container}
        >
          {!isMinimized && (
            <div
              ref={resizeHandleRef}
              className={styles.resizeHandle}
              onMouseDown={handleMouseDown}
            ></div>
          )}
          <Header />
          {!isMinimized && (
            <>
              <Messages messages={messages} />
              {showButtons && (
                <div className={styles.buttonsContainer}>
                  <button id="btn-services" className={styles.chatButton}>
                    Services
                  </button>
                  <button id="btn-contact" className={styles.chatButton}>
                    Contact
                  </button>
                  <button id="btn-events" className={styles.chatButton}>
                    Évènements
                  </button>
                  <button id="btn-ask-question" className={styles.chatButton}>
                    Poser la question
                  </button>
                </div>
              )}
              {showServiceButtons && chatApp && (
                <div className={styles.buttonsContainer}>
                  {Object.values(chatApp.description.services).map((service: any, index: number) => (
                    <button
                      key={index}
                      data-service={service.emoji}
                      className={styles.chatButton}
                    >
                      {service.emoji}
                    </button>
                  ))}
                </div>
              )}
              {showContactOptions && (
                <div className={styles.buttonsContainer}>
                  <button data-contact-method="address" className={styles.chatButton}>
                    Adresse
                  </button>
                  <button data-contact-method="phone_number" className={styles.chatButton}>
                    Cellulaire
                  </button>
                  <button data-contact-method="socials" className={styles.chatButton}>
                    Réseaux sociaux
                  </button>
                </div>
              )}
              <InputArea onSendMessage={handleSendMessage} />
              <Footer />
            </>
          )}
          {isTyping && (
            <div className={styles.typingIndicator}>
              <span>StarBot est en train d'écrire</span>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          )}
          {showScrollButton && (
            <button className={styles.scrollButton} onClick={scrollToBottom}>
              <Icon icon="ion:chevron-down-outline" width="26" height="26" />
            </button>
          )}
        </div>
      )}
      {!isMinimized && (
        <div className={styles.minimizeRoundButton} onClick={handleMinimize}>
          <Icon icon="mdi:chevron-down" width="24" height="24" color="white" />
        </div>
      )}
    </div>
  );
};

export default ChatBotSimpleApi;
