// Importation des bibliothèques React et des hooks nécessaires
import React, { useEffect, useRef, useState } from 'react';
import { format, toZonedTime } from 'date-fns-tz';
import { marked } from 'marked';
import { Icon } from '@iconify/react';
import logo from '../public/logo_startop.png'; 

// Définition d'une interface TypeScript pour les messages du chat
interface ChatBubble {
  type: 'question' | 'response' | 'error';
  text: string; 
}

// Composant fonctionnel React pour le chatbot
const ChatBotSimpleApi: React.FC = () => {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ChatBubble[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Styles for the components
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      width: '475px', 
      height: '560px', 
      backgroundColor: '#f1f4f6',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      borderRadius: '10px', 
      border: '1px solid #ccc',
      padding: '10px',
      zIndex: 1000,
      overflow: 'auto', 
      display: 'flex',
      flexDirection: 'column',
    },
    containerMinimized: {
      width: '230px',
      height: '90px',
      overflow: 'hidden',
    },
    header: {
      fontWeight: 'bold', 
      textAlign: 'center', 
      color: '#000',
      backgroundColor: 'transparent',
      padding: '10px',
      borderRadius: '10px 10px 0 0', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
    },
    logo: {
      width: '60px', 
      height: '60px', 
      marginRight: '15px', 
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start', 
    },
    headerTitle: {
      textAlign: 'left', 
      flexGrow: 1, 
      fontSize: '25px', 
      fontStyle: 'normal', 
    },
    minimizeButton: {
      backgroundColor: 'transparent', 
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: '20px',
      lineHeight: '20px',
    },
    messages: {
      flex: 1, 
      overflowY: 'auto', 
      display: 'flex',
      flexDirection: 'column',
      paddingRight: '15px',
      paddingBottom: '10px',
    },
    inputContainer: {
      display: 'flex', 
      marginTop: 'auto',
      marginBottom: '15px', 
    },
    inputWrapper: { 
      display: 'flex',
      alignItems: 'center',
      borderRadius: '15px', 
      border: '1px solid #ccc',
      padding: '5px',
    },
    input: {
      flex: 1, 
      padding: '5px',
      border: '1px solid transparent',
      borderRadius: '15px 0 0 15px',
      fontSize: '18px',
    },
    button: {
      padding: '10px', 
      border: 'none',
      backgroundColor: '#fff',
      color: '#000',
      borderRadius: '0 15px 15px 0',
      cursor: 'pointer',
      fontSize: '16px',
    },
    buttonHover: {
      backgroundColor: '#E65B53',
    },
    userBubble: {
      backgroundColor: '#f2b950', 
      borderRadius: '10px', 
      padding: '2px 5px', 
      margin: '10px 0', 
      alignSelf: 'flex-end', 
      maxWidth: '80%', 
      textAlign: 'right', 
      color: '#000', 
    },
    botBubble: {
      backgroundColor: '#ffffff', 
      borderRadius: '10px', 
      padding: '2px 5px', 
      margin: '10px 0', 
      alignSelf: 'flex-start', 
      maxWidth: '80%', 
      color: '#000000', 
    },
    resizeHandle: {
      position: 'absolute', 
      top: '0', 
      left: '0',
      width: '10px',
      height: '10px',
      backgroundColor: '#FFFFFF', 
      cursor: 'nwse-resize', 
      zIndex: 1001, 
      borderTopLeftRadius: '8px',
    },
    typingIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '10px',
      color: '#000', 
      fontSize: '16px',
      fontWeight: 'bold',
      position: 'relative',
      width: '100%',
      height: '16px',
      marginTop: '10px', 
    },
  };

  useEffect(() => {
    document.body.style.backgroundImage = 'url(/startopcapture.png)';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.height = '100vh';
    document.body.style.margin = '0';
    document.body.style.fontFamily = 'Lato, sans-serif';

    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.height = '';
      document.body.style.margin = '';
      document.body.style.fontFamily = '';
    };
  }, []);

  useEffect(() => {
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') {
      const newUserMessage: ChatBubble = { type: 'question', text: inputValue };

      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setConversationHistory((prevHistory) => [...prevHistory, newUserMessage]);
      setInputValue('');

      setIsTyping(true);

      try {
        // Fetch response from the API route
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputText: inputValue, conversationHistory }), 
        });

        const data = await response.json();

        if (data.error) {
          // Handle API route error
          console.error(data.error);
          setMessages((prevMessages) => [
            ...prevMessages,
            { type: 'error', text: 'Une erreur s\'est produite. Veuillez réessayer plus tard.' },
          ]);
        } else {
          const newBotMessage: ChatBubble = { type: 'response', text: data.responseText };
          setMessages((prevMessages) => [...prevMessages, newBotMessage]);
          setConversationHistory((prevHistory) => [...prevHistory, newBotMessage]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'error', text: 'Une erreur s\'est produite. Veuillez réessayer plus tard.' },
        ]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setInputValue(inputValue + '\n');
    }
  };

  const renderMarkdown = (text: string = '') => { // Provide a default empty string
    const formattedText = text.replace(/(\n|^)(\* )/g, '$1\n$2');
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
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div ref={containerRef} style={{ ...styles.container, ...(isMinimized ? styles.containerMinimized : {}) }}>
      {!isMinimized && <div ref={resizeHandleRef} style={styles.resizeHandle} onMouseDown={handleMouseDown}></div>}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src={logo.src} alt="Startop Logo" style={styles.logo} />
          <span style={styles.headerTitle}></span>
        </div>
        <button onClick={handleMinimize} style={styles.minimizeButton}>{isMinimized ? '➕' : '➖'}</button>
      </div>
      {!isMinimized && (
        <>
          <div style={styles.messages} id="messages">
            {messages.map((msg, index) => (
              <div key={index} style={msg.type === 'question' ? styles.userBubble : styles.botBubble} dangerouslySetInnerHTML={renderMarkdown(msg.text)} />
            ))}

            <div ref={messagesEndRef} />
          </div>
          <div style={styles.inputContainer}>
            <input
              type="text"
              id='chat-input'
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
      {isTyping && <div style={styles.typingIndicator}><span>L’assistant virtuel Startop tape</span><span>.</span><span>.</span><span>.</span></div>}
    </div>
  );
};

export default ChatBotSimpleApi;

// index.tsx for the version with MongoDB integration