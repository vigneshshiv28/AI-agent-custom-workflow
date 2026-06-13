import React from 'react';
import { Plus } from 'lucide-react';
import { Template } from '@/types/components';

interface TemplatesSectionProps {
  templates: Template[];
  onUseTemplate: (template: Template) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ templates, onUseTemplate }) => {
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Templates</h2>
        <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          View all templates
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div 
            key={template.id}
            className="group relative p-8 bg-card rounded-lg shadow-premium hover:shadow-premium-hover transition-all duration-300 cursor-pointer hover:scale-[1.01] overflow-hidden"
            onClick={() => onUseTemplate(template)}
          >
            {/* Surface Effects */}
            <div className="absolute inset-0 bg-matte-gradient opacity-100 pointer-events-none" />
            <div className="absolute inset-0 shadow-inner-glow rounded-lg pointer-events-none" />
            <div className="absolute inset-0 rounded-lg border border-white/10 pointer-events-none group-hover:border-primary/30 transition-colors" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {template.apps.map((app, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-foreground border border-white/10">
                      {app.name}
                    </span>
                  ))}
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors bg-white/5">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-3">{template.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 opacity-80">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};