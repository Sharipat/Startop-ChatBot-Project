import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ChatBotSimpleApi to prevent SSR issues
const ChatBotSimpleApi = dynamic(() => import('../ChatBotSimpleApi'), { ssr: false });

const Home: React.FC = () => {
  return (
    <div>
      <ChatBotSimpleApi />
    </div>
  );
};

export default Home;
