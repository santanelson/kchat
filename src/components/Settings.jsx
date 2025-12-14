import React, { useState } from 'react';
import { useChatwoot } from '../context/ChatwootContext';
import { Plus, Trash2, Save } from 'lucide-react';

const Settings = () => {
  const { config, setConfig, pipelines, setPipelines } = useChatwoot();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [localPipelines, setLocalPipelines] = useState(pipelines);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = () => {
    setError('');
    setSuccess('');

    if (!localConfig.baseUrl || !localConfig.token || !localConfig.accountId) {
      setError('Please fill in all Connection Settings fields.');
      return;
    }

    let cleanedUrl = localConfig.baseUrl;

    // If user enters the real Chatwoot URL, we silently switch to use our internal proxy 
    // to avoid CORS errors, but keep the conceptual 'baseUrl' for logic.
    // However, for the context state, we will store the PROXY URL.
    try {
        const urlObj = new URL(localConfig.baseUrl);
        // If it's the real chatwoot URL, we point to our local proxy path
        if (urlObj.hostname === 'chat.dout.online') {
            // We use a relative path so it hits the Nginx on the same domain
            cleanedUrl = '/chatwoot-api'; 
        } else {
             // For other domains (self-hosted elsewhere), we just use origin
             cleanedUrl = urlObj.origin;
        }
    } catch (e) {
        console.error(e);
        setError('Invalid Base URL. Example: https://chat.dout.online');
        return;
    }

    // Update config
    const finalConfig = { ...localConfig, baseUrl: cleanedUrl };
    setConfig(finalConfig);
    setPipelines(localPipelines);
    setSuccess('Settings saved successfully! Redirecting...');
    
    // Optional: Force reload if context update doesn't trigger immediately, 
    // though React state change should be enough.
  };

  const addPipeline = () => {
    const newId = `stage_${Date.now()}`;
    setLocalPipelines([...localPipelines, { id: newId, name: 'New Stage', label: '' }]);
  };

  const removePipeline = (id) => {
    setLocalPipelines(localPipelines.filter(p => p.id !== id));
  };

  const updatePipeline = (id, field, value) => {
    setLocalPipelines(localPipelines.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Connection Settings</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 border border-green-200 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chatwoot Base URL</label>
          <input
            type="text"
            placeholder="https://app.chatwoot.com"
            value={localConfig.baseUrl}
            onChange={e => setLocalConfig({...localConfig, baseUrl: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-chatwoot-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Access Token</label>
          <input
            type="password"
            placeholder="Your API Token"
            value={localConfig.token}
            onChange={e => setLocalConfig({...localConfig, token: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-chatwoot-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
          <input
            type="text"
            placeholder="1"
            value={localConfig.accountId}
            onChange={e => setLocalConfig({...localConfig, accountId: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-chatwoot-500 outline-none"
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-800">Pipelines & Labels</h2>
      <div className="space-y-4 mb-8">
        {localPipelines.map((pipeline) => (
          <div key={pipeline.id} className="flex gap-4 items-center">
             <input
                type="text"
                value={pipeline.name}
                onChange={e => updatePipeline(pipeline.id, 'name', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Stage Name"
             />
             <input
                type="text"
                value={pipeline.label}
                onChange={e => updatePipeline(pipeline.id, 'label', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Chatwoot Label"
             />
             <button onClick={() => removePipeline(pipeline.id)} className="text-red-500 hover:text-red-700">
               <Trash2 size={20} />
             </button>
          </div>
        ))}
        <button
          onClick={addPipeline}
          className="flex items-center gap-2 text-chatwoot-500 hover:text-chatwoot-600 font-medium"
        >
          <Plus size={20} /> Add Stage
        </button>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-chatwoot-500 hover:bg-chatwoot-600 text-white rounded-md font-bold transition-colors flex justify-center items-center gap-2"
      >
        <Save size={20} /> Save Configuration
      </button>
    </div>
  );
};

export default Settings;
