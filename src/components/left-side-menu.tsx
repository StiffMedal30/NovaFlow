import { FiInstagram } from "react-icons/fi";
import { BsTwitterX } from "react-icons/bs";
import { FaDiscord, FaLinkedinIn } from "react-icons/fa";
import { Bot, Lightbulb, FileQuestionMarkIcon } from "lucide-react";

export function LeftSideMenu() {
  return (
    <div className="w-64 bg-secondary-background text-text flex flex-col p-5 h-[calc(100vh-6rem)] overflow-y-auto fixed top-20 left-4 bottom-4 z-10 rounded-lg opacity-100">

      {/* Menu Items */}
      <div className="flex flex-col gap-2 flex-grow">
        <a
          href="#"
          className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors block text-sm flex items-center"
        >
          <Bot size={20} className="mr-2" /> Chat   
        </a>
        <a
          href="#"
          className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors block text-sm flex items-center"
        >
          <Lightbulb size={20} className="mr-2" /> Ideas
        </a>
        <a
          href="#"
          className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors block text-sm flex items-center"
        >
          <FileQuestionMarkIcon size={20} className="mr-2" /> Something else
        </a>
      </div>

      {/* Social Icons at Bottom */}
      <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-border/20">
        <a href="#" className="text-text hover:text-primary transition-colors">
          <FiInstagram size={20} />
        </a>
        <a href="#" className="text-text hover:text-primary transition-colors">
          <BsTwitterX size={20} />
        </a>
        <a href="#" className="text-text hover:text-primary transition-colors">
          <FaDiscord size={20} />
        </a>
        <a href="#" className="text-text hover:text-primary transition-colors">
          <FaLinkedinIn size={20} />
        </a>
      </div>
    </div>
  );
}
