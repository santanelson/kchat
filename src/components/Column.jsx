import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';

const Column = ({ stage, conversations }) => {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col h-full max-h-full">
      <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200 rounded-t-md">
        <h3 className="font-bold text-gray-700 text-sm">{stage.name}</h3>
        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
          {conversations.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className="bg-gray-50 flex-1 p-2 overflow-y-auto border-x border-b border-gray-200 rounded-b-md min-h-[150px]"
      >
        {conversations.map(conv => (
            <Card key={conv.id} conversation={conv} />
        ))}
        {conversations.length === 0 && (
            <div className="h-24 flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded">
                Empty
            </div>
        )}
      </div>
    </div>
  );
};

export default Column;
