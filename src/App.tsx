import React from 'react';
import Chatbot from './components/Chat/ChatBot'; // Import your chatbot component

const App: React.FC = () => {
  return (
    <div>
      {/* Your other application content or layout here */}
      <Chatbot /> {/* Render the chatbot component */}
    </div>
  );
};

export default App;