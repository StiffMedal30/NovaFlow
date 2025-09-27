import { useEffect } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { AuthProvider } from "./store/authStore";
import RootLayout from "./Pages/Home/layout";
import { Header } from "./components/header";
import { HomeContents } from "./components/home-contents";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./Pages/Login/page";
import RegisterPage from "./Pages/Register/page";
import SuperSecretPage from "./Pages/SuperSecret/page";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ChatPage from "./Pages/Chat/page";

function AppContent() {
  const { currentTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const isChatPage = location.pathname.toLowerCase() === '/chat';
    document.body.style.backgroundColor = isChatPage
      ? currentTheme.colors.secondary_background
      : currentTheme.colors.background;
  }, [currentTheme, location.pathname]);
  
  // Check if header should be shown (case-insensitive)
  const hiddenHeaderPaths = ["/login", "/register", "/chat"];
  const shouldShowHeader = !hiddenHeaderPaths.some(path => 
    path.toLowerCase() === location.pathname.toLowerCase()
  );

  return (
    <RootLayout>
      {shouldShowHeader && <Header />}
      <Routes>
        {/*Unprotected Routes (Anyone can access)*/}
        <Route path="/" element={<HomeContents />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<HomeContents />} />

        {/*Unprotected for development, please remove in production*/}
        <Route path="/chat" element={<ChatPage />} />

        {/*Protected Routes*/}
        <Route element={<ProtectedRoute />}>
          <Route path="/SuperSecret" element={<SuperSecretPage />} />
          {/* <Route path="/chat" element={<ChatPage />} /> REMOVE THIS COMMENT FOR PRODUCTION*/}
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