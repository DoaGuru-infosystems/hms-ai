import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./index.css";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("superAdminToken"));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("superAdminToken"));
    };
    window.addEventListener("storage", handleStorageChange);

    // Auto-logout timer based on JWT expiration
    let logoutTimer;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          const expirationTime = payload.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;
          
          if (timeUntilExpiry > 0) {
            logoutTimer = setTimeout(() => {
              alert("Session Expired: Unauthorized access. You are being redirected to login.");
              handleLogout();
            }, timeUntilExpiry);
          } else {
            // Already expired
            alert("Session Expired: Unauthorized access. You are being redirected to login.");
            handleLogout();
          }
        }
      } catch (e) {
        console.error("Invalid token format");
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminUser");
    setToken(null);
  };

  return (
    <>
      {token ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
