import { useState, useEffect } from "react";
import { X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle } from "lucide-react";

/**
 * ChatBubbleWidget - Floating chat bubble with expandable chat window
 * Adapted for mesh-app graph execution
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.theme - Theme configuration
 * @param {string} config.theme.accentColor - Primary color (default: "#3B81F6")
 * @param {Object} config.theme.button - Button configuration
 * @param {number} config.theme.button.right - Distance from right edge in px (default: 20)
 * @param {number} config.theme.button.bottom - Distance from bottom edge in px (default: 20)
 * @param {number} config.theme.button.size - Button size in px (default: 56)
 * @param {string} config.theme.button.iconColor - Icon color (default: "#ffffff")
 * @param {Object} config.theme.window - Window configuration
 * @param {string} config.theme.window.title - Window title (default: "Chat")
 * @param {number} config.theme.window.width - Window width in px (default: 380)
 * @param {number} config.theme.window.height - Window height in px (default: 640)
 * @param {boolean} config.theme.window.showTitle - Show window header (default: true)
 * @param {Object} config.theme.tooltip - Tooltip configuration
 * @param {boolean} config.theme.tooltip.show - Show tooltip (default: true)
 * @param {string} config.theme.tooltip.message - Tooltip message (default: "Hi there 👋")
 * @param {Object} config.autoOpen - Auto-open configuration
 * @param {boolean} config.autoOpen.enabled - Auto-open chat window (default: false)
 * @param {number} config.autoOpen.delay - Delay before auto-opening in ms (default: 1000)
 * @param {Object} config.footer - Footer configuration
 * @param {string} config.footer.text - Footer text
 * @param {string} config.footer.link - Footer link URL
 * @param {string} config.footer.linkText - Footer link text
 */

interface ChatBubbleWidgetConfig {
  theme?: {
    accentColor?: string;
    button?: {
      right?: number;
      bottom?: number;
      size?: number;
      iconColor?: string;
    };
    window?: {
      title?: string;
      width?: number;
      height?: number;
      showTitle?: boolean;
    };
    tooltip?: {
      show?: boolean;
      message?: string;
    };
  };
  autoOpen?: {
    enabled?: boolean;
    delay?: number;
  };
  footer?: {
    text?: string;
    link?: string;
    linkText?: string;
  };
}

interface ChatBubbleWidgetProps {
  config?: ChatBubbleWidgetConfig;
  externalOpen?: boolean | null;
  onOpenChange?: ((open: boolean) => void) | null;
  children?: React.ReactNode;
}

export default function ChatBubbleWidget({
  config = {},
  externalOpen = null,
  onOpenChange = null,
  children,
}: ChatBubbleWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Sync with external open state if provided
  useEffect(() => {
    if (externalOpen !== null) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);

  // Apply defaults
  const theme = {
    accentColor: config.theme?.accentColor || "#3B81F6",
    button: {
      right: config.theme?.button?.right ?? 20,
      bottom: config.theme?.button?.bottom ?? 20,
      size: config.theme?.button?.size ?? 56,
      iconColor: config.theme?.button?.iconColor || "#ffffff",
    },
    window: {
      title: config.theme?.window?.title || "Chat",
      width: config.theme?.window?.width ?? 380,
      height: config.theme?.window?.height ?? 640,
      showTitle: config.theme?.window?.showTitle ?? true,
    },
    tooltip: {
      show: config.theme?.tooltip?.show ?? true,
      message: config.theme?.tooltip?.message || "Hi there 👋",
    },
  };

  const autoOpen = {
    enabled: config.autoOpen?.enabled ?? false,
    delay: config.autoOpen?.delay ?? 1000,
  };

  // Auto-hide tooltip after 5 seconds
  useEffect(() => {
    if (showTooltip && theme.tooltip.show) {
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip, theme.tooltip.show]);

  // Auto-open chat if configured
  useEffect(() => {
    if (autoOpen.enabled && !isOpen) {
      const timer = setTimeout(() => setIsOpen(true), autoOpen.delay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen.enabled, autoOpen.delay, isOpen]);

  const toggleChat = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setShowTooltip(false);
    if (onOpenChange) {
      onOpenChange(newState);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsFullscreen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-150"
          onClick={toggleFullscreen}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden z-[9999] ${
              isFullscreen ? "inset-4 max-w-none max-h-none" : ""
            }`}
            style={
              !isFullscreen
                ? {
                    right: `${theme.button.right}px`,
                    bottom: `${theme.button.bottom + theme.button.size + 16}px`,
                    width: `${theme.window.width}px`,
                    height: `${theme.window.height}px`,
                    maxWidth: "calc(100vw - 32px)",
                    maxHeight: "calc(100vh - 32px)",
                  }
                : {}
            }
          >
            {/* Header */}
            {theme.window.showTitle && (
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ backgroundColor: theme.accentColor }}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">
                    {theme.window.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="group flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
                    aria-label="Toggle fullscreen"
                  >
                    <Maximize2
                      size={18}
                      className="text-white transition-colors"
                    />
                  </button>
                  <button
                    onClick={closeChat}
                    className="group flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
                    aria-label="Close chat"
                  >
                    <X size={20} className="text-white transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* Chat Content */}
            <div className="flex-1 min-h-0">{children}</div>

            {/* Configurable Footer */}
            {config?.footer && (
              <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-600 text-center">
                {config.footer.text}
                {config.footer.link && (
                  <>
                    {" "}
                    <a
                      href={config.footer.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {config.footer.linkText || config.footer.link}
                    </a>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Bubble Button */}
      <button
        onClick={toggleChat}
        className="fixed flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 z-[9999]"
        style={{
          right: `${theme.button.right}px`,
          bottom: `${theme.button.bottom}px`,
          width: `${theme.button.size}px`,
          height: `${theme.button.size}px`,
          backgroundColor: theme.accentColor,
          color: theme.button.iconColor,
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && theme.tooltip.show && !isOpen && (
        <div
          className="fixed bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap pointer-events-none z-[9999] animate-fade-in"
          style={{
            right: `${theme.button.right + theme.button.size + 16}px`,
            bottom: `${theme.button.bottom + (theme.button.size - 40) / 2}px`,
          }}
          role="tooltip"
        >
          {theme.tooltip.message}
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
