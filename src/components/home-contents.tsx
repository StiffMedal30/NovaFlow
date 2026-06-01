import { Bot, Lightbulb, Mic, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Chats } from "./Cards/Chats";
import { IdeasCard } from "./Cards/IdeasCard";
import { LeftSideMenu } from "./left-side-menu";
import ProfileComponent from "./ui/ProfileComponent";
import { useTheme } from "../context/ThemeContext";

export function HomeContents() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen overflow-hidden">
      <LeftSideMenu />

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b px-8 py-4"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <div>
            <h1 className="text-2xl font-semibold text-text">NovaFlow</h1>
            <p className="mt-1 text-sm text-text opacity-60">
              Capture rough ideas, turn voice notes into text, and refine them into something usable.
            </p>
          </div>
          <ProfileComponent />
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          <section className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/idea")}
              className="group flex min-h-40 items-start justify-between rounded-lg border p-6 text-left shadow-lg transition-opacity hover:opacity-90"
              style={{
                background: currentTheme.colors.background,
                borderColor: currentTheme.colors.border,
              }}
            >
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg p-3" style={{ background: `${currentTheme.colors.primary}20` }}>
                    <Mic size={22} color={currentTheme.colors.primary} />
                  </div>
                  <h2 className="text-xl font-semibold text-text">Capture an idea</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-text opacity-70">
                  Record a voice note or type the rough version, then send it through the refinement flow.
                </p>
              </div>
              <Plus className="mt-1 text-primary transition-transform group-hover:rotate-90" size={22} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="group flex min-h-40 items-start justify-between rounded-lg border p-6 text-left shadow-lg transition-opacity hover:opacity-90"
              style={{
                background: currentTheme.colors.background,
                borderColor: currentTheme.colors.border,
              }}
            >
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg p-3" style={{ background: `${currentTheme.colors.accent}20` }}>
                    <Bot size={22} color={currentTheme.colors.accent} />
                  </div>
                  <h2 className="text-xl font-semibold text-text">Continue a conversation</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-text opacity-70">
                  Reopen recent chats when you want to keep shaping an idea or explore next steps.
                </p>
              </div>
              <Lightbulb className="mt-1 text-primary transition-transform group-hover:scale-110" size={22} />
            </button>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Chats />
            <IdeasCard />
          </section>
        </main>
      </div>
    </div>
  );
}
