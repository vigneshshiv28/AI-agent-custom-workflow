import React from 'react';
import { Box } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  onCreate: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreate }) => {
  return (
    <div className="relative text-center py-24 px-6 border border-dashed border-white/10 rounded-lg bg-card/30 overflow-hidden">
      {/* Surface Effects */}
      <div className="absolute inset-0 bg-matte-gradient opacity-50 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-black/20 text-muted-foreground mb-8 shadow-inner border border-white/5">
          <Box className="w-10 h-10 opacity-70" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-4">No workflows yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-10 text-base leading-relaxed opacity-80">
          Get started by creating a new automation workflow. You can use our AI assistant to help you set it up.
        </p>
        <Button onClick={onCreate} variant="primary" size="lg">
          Create Workflow
        </Button>
      </div>
    </div>
  );
};