import { CircleUserRound, ChevronRight, ChevronDown } from "lucide-react";
import React from "react";

export default function AccountSettings() {
  const [isClicked, setIsClicked] = React.useState(false);

  return (
    <div>
      <div
        onClick={() => setIsClicked(!isClicked)}
        tabIndex={0}
        role="button"
        className="flex flex-row items-center justify-between cursor-pointer outline-none select-none"
        onKeyPress={e => {
          if (e.key === "Enter" || e.key === " ") setIsClicked(!isClicked);
        }}
        aria-pressed={isClicked}
      >
        {/* Collapsible Account Settings Button */}
        <div className="flex items-center">
          <CircleUserRound className="text-text" size={25} strokeWidth={1.2} />
          <a className="ml-3 text-text hover:text-primary transition-colors inline-block text-sm font-normal">
            Account
          </a>
        </div>
        {!isClicked && (
          <ChevronRight className="text-text" size={25} strokeWidth={1} />
        )}
        {isClicked && (
          <ChevronDown className="text-text" size={25} strokeWidth={1} />
        )}
      </div>
    </div>
  );
}
