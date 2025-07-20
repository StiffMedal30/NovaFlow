import { useEffect } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import RootLayout from "./Pages/Home/layout";
import { Header } from "./components/header";
import { HomeContents } from "./components/home-contents";

function AppContent() {
  const { currentTheme } = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.colors.background;
  }, [currentTheme]);

  return (
    <RootLayout>
      <Header />
      <HomeContents />
    </RootLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;