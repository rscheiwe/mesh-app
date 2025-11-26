import { useState } from "react";
import { MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBot } from "./ChatBot";
import ChatBubbleWidget from "./ChatBubbleWidget";
import ChatBubbleMeshChat from "./ChatBubbleMeshChat";

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Toggle between old and new implementation
  // Set to true to use the new ChatBubbleWidget
  const USE_NEW_WIDGET = true;

  if (USE_NEW_WIDGET) {
    return (
      <ChatBubbleWidget
        config={{
          theme: {
            accentColor: "#004b7a",
            button: {
              right: 24,
              bottom: 24,
              size: 60,
            },
            window: {
              title: "Mesh Chat",
              width: 400,
              height: 650,
            },
            tooltip: {
              show: true,
              message: "Chat with your Mesh graph! 🤖",
            },
          },
          footer: {
            text: "Powered by Mesh",
          },
        }}
      >
        <ChatBubbleMeshChat />
      </ChatBubbleWidget>
    );
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <>
          {/* Backdrop for full-screen mode */}
          {isFullScreen && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsFullScreen(false)}
            />
          )}

          <div
            className={
              isFullScreen
                ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] bg-background border rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden"
                : "fixed bottom-20 right-6 w-[400px] h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden"
            }
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">Chat</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary-foreground/10"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? "Exit full screen" : "Full screen"}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary-foreground/10"
                  onClick={() => {
                    setIsOpen(false);
                    setIsFullScreen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ChatBot />
            </div>
          </div>
        </>
      )}

      {/* Floating Bubble Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
