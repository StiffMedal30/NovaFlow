import { useEffect } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { AuthProvider } from "./store/authStore";
import RootLayout from "./Pages/Home/layout";
import { HomeContents } from "./components/home-contents";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./Pages/Login/page";
import RegisterPage from "./Pages/Register/page";
import SuperSecretPage from "./Pages/SuperSecret/page";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ChatPage from "./Pages/Chat/page";
import IdeaPage from "./Pages/Idea";

function AppContent() {
  const { currentTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const isChatPage = location.pathname.toLowerCase() === '/chat';
    document.body.style.backgroundColor = isChatPage
      ? currentTheme.colors.secondary_background
      : currentTheme.colors.secondary_background;
  }, [currentTheme, location.pathname]);

  return (
    <RootLayout>
      <Routes>
        {/*Unprotected Routes (Anyone can access)*/}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/*Protected Routes*/}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeContents />} />
          <Route path="/home" element={<HomeContents />} />
          <Route path="/SuperSecret" element={<SuperSecretPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/idea" element={<IdeaPage />} />
          <Route path="/idea/:ideaId" element={<IdeaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </RootLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
