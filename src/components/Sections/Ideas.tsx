import { useTheme } from "../../context/ThemeContext";

export function Ideas() {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        background: currentTheme.colors.secondary_background,
        borderRadius: 18,
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        border: `1.5px solid ${currentTheme.colors.border}`,
        padding: "2rem 1.5rem",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "4.5rem",
      }}
    >
      <h2 className="text-2xl font-semibold text-text mb-3">Ideas</h2>
      <div className="text-text opacity-50 text-base">
        {/* Idea content will go here */}
        <span>Your most recent ideas</span>
      </div>
    </div>
  );
}
