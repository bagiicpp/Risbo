import React, { useState } from "react";
import api from "../lib/api";
import { useNavigate, Link } from "react-router";

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/register", {
        email,
        password,
      });

      navigate("/login", { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.detail || "Registration failed.";
      setError(message);
      console.error("Registration Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <form
        onSubmit={handleRegister}
        className="p-8 bg-card border rounded-lg shadow-sm w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-foreground text-center">
          Create Account
        </h1>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded bg-transparent outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded bg-transparent outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full p-2 border rounded bg-transparent outline-none focus:ring-2 focus:ring-primary"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-primary text-primary-foreground p-2 rounded font-medium transition-colors ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary/90"
            }`}
          >
            {isSubmitting ? "Creating Account..." : "Register"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
