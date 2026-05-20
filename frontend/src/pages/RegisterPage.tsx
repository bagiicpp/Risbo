import React, { useState } from "react";
import api from "../lib/api";
import { useNavigate, Link } from "react-router";

const RegisterPage: React.FC = () => {
  // 1. Added name state
  const [name, setName] = useState("");
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
      // 2. Included name in the payload to satisfy the new Pydantic schema
      await api.post("/register", {
        name,
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background font-dmsans">
      <form
        onSubmit={handleRegister}
        className="p-8 bg-card border border-border/50 rounded-xl shadow-sm w-96"
      >
        <h1 className="text-2xl font-bricolage font-black tracking-tight mb-6 text-foreground text-center">
          Create Account
        </h1>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* 3. Added the Name input field */}
          <div>
            <label className="text-sm font-medium mb-1 block text-foreground">
              Display Name
            </label>
            <input
              type="text"
              className="w-full p-2 border border-border/50 rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-primary/50 transition-all text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blagoja"
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-foreground">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-border/50 rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-primary/50 transition-all text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-foreground">
              Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-border/50 rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-primary/50 transition-all text-foreground"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-foreground">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-border/50 rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-primary/50 transition-all text-foreground"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-2 bg-primary text-primary-foreground p-2.5 rounded-lg font-semibold transition-all duration-300 ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary/90 hover:scale-[1.02] shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            }`}
          >
            {isSubmitting ? "Creating Account..." : "Register"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
