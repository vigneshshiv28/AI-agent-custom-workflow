import React from 'react';

interface EmptyStateProps {
  onCreate: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreate }) => {
  return (
    <div className="py-16 flex flex-col items-start">
      <h3 className="text-[18px] font-semibold text-[#FAFAFA] mb-2">No workflows yet</h3>
      <p className="text-[13px] text-[#A1A1AA] mb-6">
        Create your first workflow to automate tasks.
      </p>
      <button 
        onClick={onCreate}
        className="h-[36px] px-4 bg-[#F49ACB] text-[#09090B] text-[13px] font-semibold rounded-none hover:opacity-90 transition-all duration-150 ease-ui-out active:scale-[0.97] cursor-pointer"
      >
        Create Workflow
      </button>
    </div>
  );
};