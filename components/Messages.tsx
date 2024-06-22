import React from 'react';
import { ChatBubble } from '../ChatApp';
import { marked } from 'marked';
import styles from '../styles/ChatBotStyles.module.css';

interface MessagesProps {
  messages: ChatBubble[];
}

const Messages: React.FC<MessagesProps> = ({ messages }) => {
  const renderMarkdown = (text: string) => {
    const formattedText = text.replace(/(\n|^)(\* )/g, "$1\n$2");
    const html = marked(formattedText);
    return { __html: html };
  };

  return (
    <div className={styles.messages} id="messages">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`${styles.messageContainer} ${
            msg.type === 'question' ? styles.alignRight : styles.alignLeft
          }`}
        >
          <div
            className={
              msg.type === 'question' ? styles.userLabel : styles.botLabel
            }
            style={{ alignSelf: msg.type === 'question' ? 'flex-end' : 'flex-start' }}
          >
            {msg.label || (msg.type === 'question' ? 'Vous' : 'StarBot')}
          </div>
          <div
            className={
              msg.type === 'question' ? styles.userBubble : styles.botBubble
            }
            dangerouslySetInnerHTML={renderMarkdown(msg.text)}
          />
        </div>
      ))}
    </div>
  );
};

export default Messages;
