import { useState } from "react";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isRegister = mode === "register";

  function switchMode() {
    setMode((currentMode) => (currentMode === "login" ? "register" : "login"));

    setPassword("");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";

      const body = isRegister ? { name, email, password } : { email, password };

      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed. Please try again.");
      }

      if (isRegister) {
        setMode("login");
        setPassword("");
        setMessage(
          "Account created! Ab apne email aur password se login karo.",
        );
      } else {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "420px",
        margin: "60px auto",
        padding: "20px",
      }}
    >
      <h1>DevDesk</h1>

      <h2>{isRegister ? "Create account" : "Login"}</h2>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <label htmlFor="name">Name</label>

            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoComplete="name"
              required
              disabled={loading}
            />
          </>
        )}

        <label htmlFor="email">Email</label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />

        <label htmlFor="password">Password</label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 15 : undefined}
          required
          disabled={loading}
        />

        {isRegister && (
          <p>Use at least 15 characters. Maximum length is 72 UTF-8 bytes.</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {message && <p role="status">{message}</p>}

      <p>
        {isRegister ? "Already have an account?" : "Don't have an account?"}
      </p>

      <button type="button" onClick={switchMode} disabled={loading}>
        {isRegister ? "Go to login" : "Create an account"}
      </button>
    </main>
  );
}
