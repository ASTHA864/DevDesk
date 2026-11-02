import { useCallback, useEffect, useState } from "react";

import AuthForm from "./components/AuthForm";
import TicketDashboard from "./TicketDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setSessionError("Your session has expired. Please log in again.");
  }, []);

  useEffect(() => {
    let ignore = false;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          if (!ignore) {
            setUser(null);
          }

          return;
        }

        if (!response.ok) {
          throw new Error("Could not check your session. Please try again.");
        }

        const data = await response.json();

        if (!ignore) {
          setUser(data.user);
        }
      } catch (error) {
        if (!ignore) {
          setSessionError(error.message);
        }
      } finally {
        if (!ignore) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      ignore = true;
    };
  }, []);

  function handleLogin(loggedInUser) {
    setSessionError("");
    setUser(loggedInUser);
  }

  async function handleLogout() {
    setSessionError("");
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Could not log out. Please try again.");
      }

      setUser(null);
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setLoggingOut(false);
    }
  }

  if (checkingSession) {
    return <p role="status">Checking your session...</p>;
  }

  if (!user) {
    return (
      <>
        {sessionError && <p role="alert">{sessionError}</p>}

        <AuthForm onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <header
        style={{
          padding: "16px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span>
          Welcome, {user.name} ({user.role})
        </span>

        <button type="button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </header>

      {sessionError && <p role="alert">{sessionError}</p>}

      <TicketDashboard user={user} onSessionExpired={handleSessionExpired} />
    </>
  );
}
