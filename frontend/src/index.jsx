import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Scan from "./pages/Scan";
import Chat from "./pages/Chat";
import Hydration from './pages/Hydration';
import Supplements from './pages/Supplements';
import Profile from './pages/Profile';
import "./index.css";

const Protected = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const Root = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<Protected><Landing /></Protected>} />
        <Route path="/scan" element={<Protected><Scan /></Protected>} />
        <Route path="/chat" element={<Protected><Chat /></Protected>} />
        <Route path="/hydration" element={<Protected><Hydration /></Protected>} />
        <Route path="/supplements" element={<Protected><Supplements /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/" element={<Protected><Navigate to="/landing" replace /></Protected>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

createRoot(document.getElementById("root")).render(<Root />);
