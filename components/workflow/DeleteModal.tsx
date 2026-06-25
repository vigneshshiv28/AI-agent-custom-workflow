"use client";

import React, { useEffect } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteModal({
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
  title = "Delete Workflow",
  description = "Are you sure you want to delete this workflow? This action cannot be undone.",
}: DeleteModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090B]/80 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-[400px] bg-[#111113] border border-[#26262B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 text-[#F87171]">
              <div className="w-8 h-8 rounded-full bg-[#F87171]/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-[15px] font-semibold tracking-tight text-[#FAFAFA]">
                {title}
              </h2>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              disabled={isDeleting}
              className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-[13px] text-[#A1A1AA] leading-relaxed mb-6">
            {description}
          </p>
          
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              disabled={isDeleting}
              className="h-9 px-4 text-[13px] font-medium text-[#FAFAFA] bg-[#161618] hover:bg-[#26262B] border border-[#26262B] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onConfirm(); }}
              disabled={isDeleting}
              className="h-9 px-4 flex items-center justify-center gap-2 text-[13px] font-medium text-white bg-[#EF4444] hover:bg-[#DC2626] transition-colors disabled:opacity-50 min-w-[100px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
