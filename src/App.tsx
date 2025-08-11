import { useEffect } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import RootLayout from "./Pages/Home/layout";
import { Header } from "./components/header";
import { HomeContents } from "./components/home-contents";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./Pages/Login/page";
import RegisterPage from "./Pages/Register/page";

function AppContent() {
  const { currentTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.colors.background;
  }, [currentTheme]);

  return (
    <RootLayout>
      {location.pathname !== "/login" && location.pathname !== "/register" && <Header />}
      <Routes>
        <Route path="/" element={<HomeContents />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<HomeContents />} />
      </Routes>
    </RootLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}