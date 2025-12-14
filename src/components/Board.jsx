import React, { useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useChatwoot } from '../context/ChatwootContext';
import Column from './Column';
import Card from './Card';
import { ListFilter } from 'lucide-react';

const Board = () => {
    const { funnels, activeFunnelId, setActiveFunnelId, conversations, refreshConversations, moveConversation, loading, error } = useChatwoot();
    const [activeId, setActiveId] = React.useState(null);

    const activeFunnel = useMemo(() => funnels.find(f => f.id === activeFunnelId) || funnels[0], [funnels, activeFunnelId]);
    const stages = useMemo(() => activeFunnel?.stages || [], [activeFunnel]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Group conversations by pipeline (Label matching logic)
    const columns = useMemo(() => {
        const groups = {};
        stages.forEach(s => groups[s.id] = []);
        
        conversations.forEach(conv => {
            const convLabels = conv.labels || [];
            // Find the first stage in the ACTIVE funnel that matches one of the labels
            const matchedStage = stages.find(s => convLabels.includes(s.label));
            
            if (matchedStage) {
                groups[matchedStage.id].push(conv);
            } else {
                // If it doesn't match any stage in current funnel, it's hidden (or we could show in an Inbox)
            }
        });
        return groups;
    }, [stages, conversations]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        
        if (!over) return;

        const activeConvId = active.id;
        const overStageId = over.id;
        
        // Find current stage of active conversation FROM DATA
        const activeConv = conversations.find(c => c.id.toString() === activeConvId.toString());
        if (!activeConv) return;
        
        // Find which stage it belongs to currently IN THIS FUNNEL
        const currentStage = stages.find(s => (activeConv.labels || []).includes(s.label));
        const currentStageId = currentStage ? currentStage.id : null;

        if (currentStageId !== overStageId) {
            moveConversation(parseInt(activeConvId), currentStageId, overStageId);
        }
        
        setActiveId(null);
    };

    const activeConversation = useMemo(() => {
        return conversations.find(c => c.id.toString() === activeId?.toString());
    }, [activeId, conversations]);

    if (loading && conversations.length === 0) {
        return <div className="p-10 text-center text-gray-500">Loading pipelines...</div>;
    }
    
    if (error) {
         return <div className="p-10 text-center text-red-500">{error}</div>;
    }

    if (!activeFunnel) {
         return <div className="p-10 text-center text-gray-500">No Pipeline Configured. Go to Settings.</div>;
    }

    return (
        <div className="h-full flex flex-col">
            {/* Funnel Selector Header */}
            {funnels.length > 1 && (
                <div className="px-6 py-2 bg-white border-b border-gray-200 flex items-center gap-2">
                    <ListFilter size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-500 mr-2">Pipeline:</span>
                    <div className="flex gap-2">
                        {funnels.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFunnelId(f.id)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                    activeFunnelId === f.id 
                                    ? 'bg-chatwoot-100 text-chatwoot-700 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex overflow-x-auto p-4 gap-4 bg-gray-50">
                    {stages.map(stage => (
                        <Column key={stage.id} stage={stage} conversations={columns[stage.id] || []} />
                    ))}
                </div>
                
                <DragOverlay>
                    {activeConversation ? <Card conversation={activeConversation} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default Board;
