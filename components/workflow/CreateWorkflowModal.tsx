import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ isOpen, onClose, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative bg-card rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Surface Effects */}
        <div className="absolute inset-0 bg-matte-gradient opacity-100 pointer-events-none" />
        <div className="absolute inset-0 shadow-inner-glow rounded-lg pointer-events-none" />
        <div className="absolute inset-0 rounded-lg border border-white/10 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            Create AI Workflow
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-white/5 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 p-8">
          <label className="block text-sm font-medium text-foreground mb-4">
            What would you like to automate?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Summarize my unread emails every morning and send a digest to Slack."
            className="w-full h-48 p-5 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none text-sm text-foreground placeholder:text-muted-foreground/50 shadow-inner transition-all"
          />

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>

          </div>
        </div>
        <div className="relative z-10 bg-white/5 px-8 py-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground text-center">
            Powered by Gemini AI models.
          </p>
        </div>
      </div>
    </div>
  );
};