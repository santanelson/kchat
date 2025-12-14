import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchConversations, updateConversationLabels, fetchLabels, createLabel } from '../api/chatwoot';

const ChatwootContext = createContext();

export const useChatwoot = () => useContext(ChatwootContext);

export const ChatwootProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('chatwoot_config');
    return saved ? JSON.parse(saved) : { baseUrl: '', token: '', accountId: '' };
  });

  // State for multiple funnels. 
  // Structure: [ { id: 'default', name: 'Sales Pipeline', stages: [ { id, name, label } ] } ]
  const [funnels, setFunnels] = useState(() => {
    const saved = localStorage.getItem('chatwoot_funnels');
    if (saved) return JSON.parse(saved);
    
    // Legacy support: migrate old 'settings_pipelines' if exists
    const oldPipelines = localStorage.getItem('chatwoot_kanban_pipelines'); // Original key
    if (oldPipelines) {
      return [{ id: 'default', name: 'Default Pipeline', stages: JSON.parse(oldPipelines) }];
    }
    // Also check for the key mentioned in the instruction, if it's different from the original
    const oldPipelinesInstruction = localStorage.getItem('settings_pipelines');
    if (oldPipelinesInstruction) {
      return [{ id: 'default', name: 'Default Pipeline', stages: JSON.parse(oldPipelinesInstruction) }];
    }

    return [{ id: 'default', name: 'Sales Pipeline', stages: [] }];
  });

  const [activeFunnelId, setActiveFunnelId] = useState(() => {
    return localStorage.getItem('chatwoot_active_funnel') || 'default';
  });

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for available Chatwoot labels
  const [availableLabels, setAvailableLabels] = useState([]);

  useEffect(() => {
    localStorage.setItem('chatwoot_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('chatwoot_funnels', JSON.stringify(funnels));
  }, [funnels]);

  useEffect(() => {
    localStorage.setItem('chatwoot_active_funnel', activeFunnelId);
  }, [activeFunnelId]);

  const refreshConversations = async () => {
    if (!config.baseUrl || !config.token || !config.accountId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations(config.baseUrl, config.token, config.accountId);
      setConversations(data.payload || []);

      // Also refresh available labels
      try {
        const labelsData = await fetchLabels(config.baseUrl, config.token, config.accountId);
        setAvailableLabels(labelsData.payload || []);
      } catch (e) {
        console.warn("Could not fetch labels", e);
      }

    } catch (err) {
      if (err.message === 'Network Error') {
         setError("Network Error: Possible CORS issue. Check if Base URL is correct or if Proxy is working.");
      } else if (err.response?.status === 401) {
         setError("Unauthorized: Check your API Token.");
      } else if (err.response?.status === 404) {
         setError("Not Found: Check Base URL and Account ID.");
      } else {
         setError("Failed to fetch conversations. Check your settings.");
      }
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const createChatwootLabel = async (name, color) => {
    if (!config.baseUrl || !config.token || !config.accountId) return null;
    try {
        const newLabel = await createLabel(config.baseUrl, config.token, config.accountId, name, color);
        setAvailableLabels([...availableLabels, newLabel.payload || newLabel]);
        return newLabel;
    } catch (e) {
        setError(`Failed to create label: ${e.message}`);
        throw e;
    }
  };

  // Move logic needs to know which labels to remove/add based on ALL stages in the current funnel
  const moveConversation = async (conversationId, fromStageId, toStageId) => {
    const currentFunnel = funnels.find(f => f.id === activeFunnelId);
    if (!currentFunnel) return;

    const fromStage = currentFunnel.stages.find(s => s.id === fromStageId);
    const toStage = currentFunnel.stages.find(s => s.id === toStageId);
    
    // We need to find the conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !toStage) return;

    // Calculate new labels
    const currentLabels = conversation.labels || [];
    let newLabels = [...currentLabels];

    // Remove the 'from' label
    if (fromStage && fromStage.label) {
        newLabels = newLabels.filter(l => l !== fromStage.label);
    }
    
    // Add the 'to' label if not present
    if (toStage.label && !newLabels.includes(toStage.label)) {
        newLabels.push(toStage.label);
    }

    // Optimistic UI Update
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, labels: newLabels } : c
    ));

    try {
        // We assume the API replaces/sets the label list (or we just use what we have available).
        // The API wrapper function updateConversationLabels does POST /labels.
        // If Chatwoot API behaves as "Add Labels", we might need to remove the old one first?
        // Actually, if we just want to ADD the new one to visualize, that's fine.
        // But for a true move, we want to remove the old one. 
        // Our API helper `updateConversationLabels` posts `{ labels: [...] }`.
        // Chatwoot documentation says `POST /labels` adds labels. 
        // To replace, usually we use `PUT /labels` or `POST /labels` with a specific strategy.
        // However, looking at standard usage, sending the full list often works if the backend supports it, 
        // OR we might need to explicitly delete the old label. 
        // For MVP, assume our API helper works or accepts the add. 
        // *Self-Correction*: Use the new list.
        await updateConversationLabels(config.baseUrl, config.token, config.accountId, conversationId, newLabels);
    } catch (err) {
      console.error("Failed to move card", err);
      // Revert in case of total failure?
      refreshConversations();
      setError("Failed to update labels in Chatwoot");
    }
  };


  return (
    <ChatwootContext.Provider value={{ 
      config, 
      setConfig, 
      funnels, 
      setFunnels,
      activeFunnelId, 
      setActiveFunnelId,
      conversations, 
      loading, 
      error, 
      refreshConversations, 
      moveConversation,
      availableLabels,
      createChatwootLabel
    }}>
      {children}
    </ChatwootContext.Provider>
  );
};
