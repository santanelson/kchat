import React, { useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useChatwoot } from '../context/ChatwootContext';
import Column from './Column';
import Card from './Card';

const Board = () => {
    const { pipelines, conversations, refreshConversations, moveConversation, loading, error } = useChatwoot();
    const [activeId, setActiveId] = React.useState(null);

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
        pipelines.forEach(p => groups[p.id] = []);
        
        // Uncategorized bucket? For now assuming if it matches a pipeline label it goes there. 
        // If matches multiple, first one wins? Or duplicate?
        // Let's go with: It goes to the first pipeline whose label is in conv.labels.
        // If none, maybe "No Stage"? 
        
        conversations.forEach(conv => {
            const convLabels = conv.labels || [];
            const pipeline = pipelines.find(p => convLabels.includes(p.label));
            if (pipeline) {
                groups[pipeline.id].push(conv);
            } else {
                // If we want a generic "Inbox" column, we'd need to add it to pipelines by default or handle here.
                // For now, only showing conversations that match a pipeline label? 
                // Or maybe put them in the first column if "Inbox"? 
                // Let's just create a virtual "Inbox" if user didn't configure? No, sticking to configured pipelines.
            }
        });
        return groups;
    }, [pipelines, conversations]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        
        if (!over) return;

        const activeConvId = active.id;
        const overStageId = over.id;
        
        // Find current stage of active conversation
        const activeConv = conversations.find(c => c.id.toString() === activeConvId.toString());
        if (!activeConv) return;
        
        // Find which pipeline it belongs to currently
        const currentPipeline = pipelines.find(p => (activeConv.labels || []).includes(p.label));
        const currentStageId = currentPipeline ? currentPipeline.id : null;

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

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-60px)] flex overflow-x-auto p-4 gap-4 bg-white">
                {pipelines.map(stage => (
                    <Column key={stage.id} stage={stage} conversations={columns[stage.id] || []} />
                ))}
            </div>
            
            <DragOverlay>
                {activeConversation ? <Card conversation={activeConversation} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Board;
