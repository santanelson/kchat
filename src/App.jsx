import React from 'react';
import { ChatwootProvider, useChatwoot } from './context/ChatwootContext';
import Settings from './components/Settings';
import Board from './components/Board';

const Main = () => {
  const { config } = useChatwoot();

  if (!config.baseUrl || !config.token || !config.accountId) {
    return <Settings />;
  }

  return (
    <div>
      <div className="flex justify-end p-4 bg-white border-b border-gray-200">
         <button 
           onClick={() => window.location.reload()} 
           className="text-sm text-gray-500 hover:text-gray-700 underline"
         >
           Reload
         </button>
         <span className="mx-2 text-gray-300">|</span>
         {/* Simple way to get back to settings for now */}
         <button 
           onClick={() => localStorage.removeItem('chatwoot_kanban_config') || window.location.reload()}
           className="text-sm text-gray-500 hover:text-gray-700 underline"
         >
           Reset Config
         </button>
      </div>
      <Board />
    </div>
  );
};

function App() {
  return (
    <ChatwootProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Main />
      </div>
    </ChatwootProvider>
  );
}

export default App;
