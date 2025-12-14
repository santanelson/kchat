import { createContext, useContext, useState, useEffect } from 'react';
import { fetchConversations, updateConversationLabels } from '../api/chatwoot';

const ChatwootContext = createContext();

export const useChatwoot = () => useContext(ChatwootContext);

export const ChatwootProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('chatwoot_kanban_config');
    return saved ? JSON.parse(saved) : { baseUrl: '', token: '', accountId: '' };
  });

  const [pipelines, setPipelines] = useState(() => {
    const saved = localStorage.getItem('chatwoot_kanban_pipelines');
    return saved ? JSON.parse(saved) : [
      { id: 'todo', name: 'To Do', label: 'todo' },
      { id: 'doing', name: 'Doing', label: 'doing' },
      { id: 'done', name: 'Done', label: 'done' }
    ];
  });

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('chatwoot_kanban_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('chatwoot_kanban_pipelines', JSON.stringify(pipelines));
  }, [pipelines]);

  const refreshConversations = async () => {
    if (!config.baseUrl || !config.token || !config.accountId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations(config.baseUrl, config.token, config.accountId);
      setConversations(data.payload || []);
    } catch (err) {
      console.error("Fetch error:", err);
      let msg = "Failed to fetch conversations.";
      if (err.response) {
          if (err.response.status === 401) msg = "Unauthorized: Check your API Token.";
          else if (err.response.status === 404) msg = "Not Found: Check Base URL and Account ID.";
          else msg = `Error (${err.response.status}): ${err.response.statusText}`;
      } else if (err.request) {
          msg = "Network Error: Possible CORS issue or server unreachable.";
      }
      setError(msg);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    refreshConversations();
  }, [config.baseUrl, config.token, config.accountId]);

  const moveConversation = async (conversationId, fromStageId, toStageId) => {
    // Optimistic Update
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Find label handling
    const fromPipeline = pipelines.find(p => p.id === fromStageId);
    const toPipeline = pipelines.find(p => p.id === toStageId);
    
    // We assume the conversation has the fromLabel.
    // New labels = (Current Labels - fromLabel) + toLabel
    
    const currentLabels = conversation.labels || [];
    let newLabels = [...currentLabels];
    
    if (fromPipeline) {
        newLabels = newLabels.filter(l => l !== fromPipeline.label);
    }
    if (toPipeline && !newLabels.includes(toPipeline.label)) {
        newLabels.push(toPipeline.label);
    }

    // Optimistic update local state
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, labels: newLabels } : c
    ));

    // API Call
    try {
      await updateConversationLabels(config.baseUrl, config.token, config.accountId, conversationId, newLabels);
    } catch (err) {
      console.error("Failed to update labels remotely", err);
      // Revert if needed? For now just log.
      refreshConversations(); // Re-sync to be safe
    }
  };

  const value = {
    config,
    setConfig,
    pipelines,
    setPipelines,
    conversations,
    loading,
    error,
    refreshConversations,
    moveConversation
  };

  return (
    <ChatwootContext.Provider value={value}>
      {children}
    </ChatwootContext.Provider>
  );
};
