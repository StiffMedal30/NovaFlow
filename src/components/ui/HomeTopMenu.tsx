import { useTheme } from "../../context/ThemeContext";

const HomeTopMenu = () => {
  const { currentTheme } = useTheme();

    return (
        <div
          className="flex items-center gap-20 px-4 py-2"
          style={{
            backgroundColor: currentTheme.colors.background,
            borderRadius: 18,
            boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
            border: `1.5px solid ${currentTheme.colors.border}`,
          }}
        >
            <button
                className="flex items-center justify-center p-2 rounded-lg text-text hover:text-primary transition-colors"
            >
                Whats New?
            </button>

            <button
                className="flex items-center justify-center p-2 rounded-lg text-text hover:text-primary transition-colors"
            >
                About Us
            </button>

            <button
                className="flex items-center justify-center p-2 rounded-lg text-text hover:text-primary transition-colors"
            >
                Give Us Money
            </button>

            <button
                className="flex items-center justify-center p-2 rounded-lg text-text hover:text-primary transition-colors"
            >
                Adopt an orphan
            </button>
        </div>
    );
}

export default HomeTopMenu;