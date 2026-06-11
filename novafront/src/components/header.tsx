import { CircleUserRound, MessageSquareText } from "lucide-react"
import { SettingsDropdown } from "./ui/settings-dropdown"
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  return (
    <>
      <header className="fixed top-0 left-0 w-full box-border flex items-center justify-between h-16 px-8 pt-8 pb-4 z-50 bg-background text-text border-b border-text">
        <a
          href="#"
          className="text-3xl font-normal text-text font-['Didact_Gothic'] no-underline"
        >
          NovaFlow
        </a>
        <div className="flex items-center gap-5">
          {/* Message Button */}
          <button
            className="bg-none border-none p-0 cursor-pointer flex items-center hover:opacity-80 transition-opacity"
            onClick={() => {navigate('/SuperSecret')}}
          >
            <MessageSquareText
              size={40}
              className="text-text pb-1"
              strokeWidth={1.2}
            />
          </button>
          {/* Settings Dropdown */}
          <SettingsDropdown>
            <button
              className="bg-none border-none p-0 cursor-pointer flex items-center outline-none hover:opacity-80 transition-opacity"
            >
              <CircleUserRound
                size={40}
                className="text-text pb-1"
                strokeWidth={1.2}
              />
            </button>
          </SettingsDropdown>
        </div>
      </header>
    </>
  )
}
