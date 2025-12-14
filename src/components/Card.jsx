import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MessageSquare, User, Clock } from 'lucide-react';

const Card = ({ conversation }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conversation.id.toString(),
    data: { conversation }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  // Extract meta info
  const contactName = conversation.meta?.sender?.name || 'Unknown Contact';
  const lastMessage = conversation.messages?.[0]?.content || 'No messages';
  const timeAgo = conversation.timestamp ? new Date(conversation.timestamp * 1000).toLocaleDateString() : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-3 cursor-grab hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-sm truncate flex-1">{contactName}</h4>
        <span className="text-xs text-gray-400">ID: {conversation.id}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{lastMessage}</p>
      
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
            <MessageSquare size={12} />
        </div>
        <div className="flex items-center gap-1 ml-auto">
            <Clock size={12} />
            {timeAgo}
        </div>
      </div>
    </div>
  );
};

export default Card;
