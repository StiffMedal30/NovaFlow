import React from "react";
import { Lightbulb, MessageSquareQuote } from "lucide-react";

interface Chat {
    id: number;
    title: string;
    messages?: string[];
}

export function ChatSideMenu() {

    const [mockChats, setMockChats] = React.useState<Chat[]>([
        { id: 1, title: "Chat 1", messages: [] },
        { id: 2, title: "Chat 2", messages: [] },
        { id: 3, title: "Chat 3", messages: [] },
    ]);

    const handleNewChat = () => { //TODO
        console.log("Create New Chat");
        const newChat: Chat = { id: Date.now(), title: `Chat ${mockChats.length + 1}`, messages: [] };
        setMockChats([...mockChats, newChat]);
    }

    const loadChat = (chatid: number) => {
        console.log("Load Chat", chatid);
    }
  
    return (
    <div className="w-64 min-h-[83vh] bg-secondary-background text-text flex flex-col p-5 h-[calc(100vh-6rem)] overflow-y-auto fixed top-20 left-4 bottom-4 z-10 rounded-lg opacity-100">

        <div className="flex flex-col gap-2 flex-grow">
        <a
            href="#"
            className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors text-md flex items-center"
            onClick={(e) => {
                e.preventDefault();
                handleNewChat();
            }}
        >
            <MessageSquareQuote size={20} className="mr-3" /> New Chat
        </a>

        <div className="border-b border-text" /> {/* Divider */}

        <div className="px-3 py-2 rounded-md no-underline text-text transition-colors text-sm flex flex-col">
            {mockChats.map(chat => (
                <a 
                    key={chat.id} 
                    className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors text-md flex items-center"
                    onClick={(e) => {
                        e.preventDefault();
                        loadChat(chat.id);
                    }}
                >
                    {chat.title}
                </a>
            ))}
        </div>

        </div>
    </div>
    );
}
