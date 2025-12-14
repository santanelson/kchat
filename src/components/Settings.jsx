import React, { useState, useEffect } from 'react';
import { useChatwoot } from '../context/ChatwootContext';
import { Plus, Trash2, Save, Layout, Tag } from 'lucide-react';
import classNames from 'classnames';

const Settings = () => {
  const { config, setConfig, funnels, setFunnels, activeFunnelId, setActiveFunnelId, availableLabels, createChatwootLabel } = useChatwoot();
  
  const [localConfig, setLocalConfig] = useState(config);
  
  // Local state for funnels to allow editing before saving
  const [localFunnels, setLocalFunnels] = useState(funnels);
  const [selectedFunnelId, setSelectedFunnelId] = useState(activeFunnelId || funnels[0]?.id);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagCreating, setTagCreating] = useState(null); // id of stage being created

  useEffect(() => {
    // Keep local selection in sync if it becomes invalid
    if (!localFunnels.find(f => f.id === selectedFunnelId) && localFunnels.length > 0) {
        setSelectedFunnelId(localFunnels[0].id);
    }
  }, [localFunnels, selectedFunnelId]);

  const handleSave = () => {
    setError('');
    setSuccess('');

    if (!localConfig.baseUrl || !localConfig.token || !localConfig.accountId) {
      setError('Please fill in all Connection Settings fields.');
      return;
    }

    let cleanedUrl = localConfig.baseUrl;

    // If user enters the real Chatwoot URL, we silently switch to use our internal proxy 
    try {
        const urlObj = new URL(localConfig.baseUrl);
        if (urlObj.hostname === 'chat.dout.online') {
            cleanedUrl = '/chatwoot-api'; 
        } else {
             cleanedUrl = urlObj.origin;
        }
    } catch (e) {
        console.error(e);
        setError('Invalid Base URL. Example: https://chat.dout.online');
        return;
    }

    const finalConfig = { ...localConfig, baseUrl: cleanedUrl };
    setConfig(finalConfig);
    setFunnels(localFunnels);
    setActiveFunnelId(selectedFunnelId);
    setSuccess('Settings saved successfully! Redirecting...');
  };

  // Funnel Operations
  const addFunnel = () => {
    const newId = `funnel_${Date.now()}`;
    setLocalFunnels([...localFunnels, { id: newId, name: 'New Pipeline', stages: [] }]);
    setSelectedFunnelId(newId);
  };

  const removeFunnel = (id) => {
    if (localFunnels.length <= 1) {
        setError("You must have at least one pipeline.");
        return;
    }
    setLocalFunnels(localFunnels.filter(f => f.id !== id));
  };

  const updateFunnelName = (id, name) => {
    setLocalFunnels(localFunnels.map(f => f.id === id ? { ...f, name } : f));
  };

  // Stage Operations
  const getCurrentFunnel = () => localFunnels.find(f => f.id === selectedFunnelId);
  
  const addStage = () => {
    const funnel = getCurrentFunnel();
    if (!funnel) return;
    
    const newStage = { id: `stage_${Date.now()}`, name: 'New Stage', label: '' };
    const updatedFunnel = { ...funnel, stages: [...funnel.stages, newStage] };
    
    setLocalFunnels(localFunnels.map(f => f.id === selectedFunnelId ? updatedFunnel : f));
  };

  const removeStage = (stageId) => {
    const funnel = getCurrentFunnel();
    const updatedStages = funnel.stages.filter(s => s.id !== stageId);
    setLocalFunnels(localFunnels.map(f => f.id === selectedFunnelId ? { ...f, stages: updatedStages } : f));
  };

  const updateStage = (stageId, field, value) => {
    const funnel = getCurrentFunnel();
    const updatedStages = funnel.stages.map(s => s.id === stageId ? { ...s, [field]: value } : s);
    setLocalFunnels(localFunnels.map(f => f.id === selectedFunnelId ? { ...f, stages: updatedStages } : f));
  };

  const handleCreateTag = async (stageId, tagName) => {
    if (!tagName) return;
    setTagCreating(stageId);
    try {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        const newLabel = await createChatwootLabel(tagName, randomColor);
        // Automatically set the label input to the created tag
        updateStage(stageId, 'label', newLabel.title);
        setSuccess(`Tag '${newLabel.title}' created in Chatwoot!`);
    } catch (e) {
        setError("Failed to create tag: " + e.message);
    } finally {
        setTagCreating(null);
    }
  };

  const currentFunnel = getCurrentFunnel();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Settings</h2>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-600 border border-green-200 rounded-md text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: API Config */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Layout size={18} /> API Connection</h3>
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chatwoot Base URL</label>
                <input type="text" placeholder="https://app.chatwoot.com" value={localConfig.baseUrl} onChange={e => setLocalConfig({...localConfig, baseUrl: e.target.value})} className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-chatwoot-500" />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Access Token</label>
                <input type="password" placeholder="Your API Token" value={localConfig.token} onChange={e => setLocalConfig({...localConfig, token: e.target.value})} className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-chatwoot-500" />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <input type="text" placeholder="1" value={localConfig.accountId} onChange={e => setLocalConfig({...localConfig, accountId: e.target.value})} className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-chatwoot-500" />
                </div>
            </div>
          </div>

          {/* Right Column: Pipeline Config */}
          <div>
             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Layout size={18} /> Pipelines Setup</h3>
             
             {/* Pipeline Selector */}
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {localFunnels.map(f => (
                    <button 
                        key={f.id}
                        onClick={() => setSelectedFunnelId(f.id)}
                        className={classNames("px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap", {
                            "bg-chatwoot-500 text-white": selectedFunnelId === f.id,
                            "bg-gray-100 text-gray-600 hover:bg-gray-200": selectedFunnelId !== f.id
                        })}
                    >
                        {f.name}
                    </button>
                ))}
                <button onClick={addFunnel} className="px-2 py-1 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200" title="Add Pipeline"><Plus size={16} /></button>
             </div>

            {currentFunnel && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <input 
                            value={currentFunnel.name}
                            onChange={(e) => updateFunnelName(currentFunnel.id, e.target.value)}
                            className="text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-chatwoot-500 outline-none w-full"
                        />
                        <button onClick={() => removeFunnel(currentFunnel.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={16} /></button>
                    </div>

                    <div className="space-y-3">
                        {currentFunnel.stages.map((stage) => {
                            // Check if label exists in Chatwoot
                            const labelExists = availableLabels.some(l => l.title === stage.label);
                            const isUnknownLabel = stage.label && !labelExists;

                            return (
                             <div key={stage.id} className="p-3 bg-white rounded border border-gray-200 shadow-sm">
                                <div className="flex gap-2 mb-2">
                                    <input placeholder="Stage Name" value={stage.name} onChange={e => updateStage(stage.id, 'name', e.target.value)} className="flex-1 p-1 border border-gray-300 rounded text-sm"/>
                                    <button onClick={() => removeStage(stage.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Tag size={14} className="text-gray-400" />
                                    <input 
                                        placeholder="Chatwoot Label" 
                                        value={stage.label} 
                                        onChange={e => updateStage(stage.id, 'label', e.target.value)} 
                                        className={classNames("flex-1 p-1 border rounded text-sm", {
                                            "border-red-300 bg-red-50": isUnknownLabel && stage.label.length > 2,
                                            "border-gray-300": !isUnknownLabel
                                        })}
                                    />
                                    {isUnknownLabel && stage.label.length > 2 && (
                                        <button 
                                            onClick={() => handleCreateTag(stage.id, stage.label)}
                                            disabled={tagCreating === stage.id}
                                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 whitespace-nowrap"
                                        >
                                            {tagCreating === stage.id ? 'Creating...' : 'Create Tag'}
                                        </button>
                                    )}
                                </div>
                             </div>
                            );
                        })}
                    </div>
                    
                    <button onClick={addStage} className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:border-chatwoot-500 hover:text-chatwoot-500 flex justify-center items-center gap-2 text-sm">
                        <Plus size={16} /> Add Stage
                    </button>
                </div>
            )}
          </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button onClick={handleSave} className="w-full py-3 bg-chatwoot-500 hover:bg-chatwoot-600 text-white rounded-md font-bold transition-colors flex justify-center items-center gap-2">
            <Save size={20} /> Save Configuration
        </button>
      </div>
    </div>
  );
};

export default Settings;
