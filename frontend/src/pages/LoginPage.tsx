import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";
import { useNavigate } from "react-router";
import { Link } from "react-router";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await api.post("/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      login(res.data.access_token);

      navigate("/chat");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Authentication failed.";
      setError(message);
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-card border rounded-lg shadow-sm w-96"
      >
        <h1 className="text-2xl font-bold mb-6">Login to RizzBo</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white p-2 rounded hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
