"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ComingSoonDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonDialog({ isOpen, onClose }: ComingSoonDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">🚀</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Coming Soon!
          </h2>

          <p className="text-gray-600 mb-4">
            This feature is currently in development and will be available soon.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            We&apos;re working on integrating with Retell.ai to bring you complete call analytics.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
