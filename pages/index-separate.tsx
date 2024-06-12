import Head from 'next/head';
import Chatbot from '../components/Chat/ChatBot';

export default function Home() {
  return (
    <>
      <Head>
        <title>Startop Chatbot</title>
        <meta name="description" content="Startop chatbot" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <Chatbot />
      </main>
    </>
  );
}


// Path: pages/index.tsx
// index for the version of the chatbot that uses the separate API route