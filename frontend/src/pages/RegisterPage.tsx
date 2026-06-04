import React, { useState, useRef } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate, Link } from "react-router";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

type Step = "register" | "verify";

interface ApiErrorResponse {
  detail: string;
}

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<Step>("register");

  // Registration fields (Role removed for Progressive Profiling)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Verification fields — 6 individual digit inputs
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // --- Step 1: Register ---
  const handleRegister = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Hardcoded base URL due to raw axios usage.
      // Ensure this aligns with your environment variables in production.
      await axios.post("http://localhost:8080/register", {
        name,
        email,
        password,
      });
      setStep("verify");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.detail ||
          "Registration failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Step 2: Verify code ---
  const handleVerify = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);

    const code = digits.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:8080/verify-email", {
        email,
        code,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.detail ||
          "Verification failed. Invalid or expired code.",
      );
      setDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-advance focus as digits are typed
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...digits];
    updated[index] = value.slice(-1);
    setDigits(updated);
    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setDigits(newDigits);

      const focusIndex = Math.min(pastedData.length, 5);
      digitRefs.current[focusIndex]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background font-dmsans p-4 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <Card className="border-border/40 shadow-2xl bg-card/80 backdrop-blur-xl rounded-2xl">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Registration form ── */}
            {step === "register" && (
              <motion.div
                key="register"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.3, staggerChildren: 0.1 },
                  },
                  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <CardHeader className="space-y-2 text-center pt-8 pb-4">
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-3xl font-bricolage font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Create Account
                    </CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-base">
                      Join RizzBo and elevate your experience
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-6 px-8">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                      >
                        <Alert variant="destructive" className="py-2.5">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    <div className="space-y-5">
                      <motion.div variants={itemVariants} className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-muted-foreground ml-1"
                        >
                          Display Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="e.g. Blagoja"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onPaste={handlePaste}
                          required
                          minLength={2}
                          maxLength={50}
                          className="bg-background/50 h-12 rounded-xl border-border/50 focus:bg-background transition-colors"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-muted-foreground ml-1"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="hello@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-background/50 h-12 rounded-xl border-border/50 focus:bg-background transition-colors"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-muted-foreground ml-1"
                        >
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="bg-background/50 h-12 rounded-xl border-border/50 focus:bg-background transition-colors"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-muted-foreground ml-1"
                        >
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="bg-background/50 h-12 rounded-xl border-border/50 focus:bg-background transition-colors"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      variants={itemVariants}
                      className="flex justify-center pt-8 pb-4"
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 h-12 rounded-full font-bold text-md shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] transition-all hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>

                  <CardFooter className="flex flex-col pb-8">
                    <motion.p
                      variants={itemVariants}
                      className="text-center text-sm text-muted-foreground w-full mt-2"
                    >
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="text-primary hover:text-primary/80 transition-colors font-semibold"
                      >
                        Log in
                      </Link>
                    </motion.p>
                  </CardFooter>
                </form>
              </motion.div>
            )}

            {/* ── Step 2: Email verification ── */}
            {step === "verify" && (
              <motion.div
                key="verify"
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.3, staggerChildren: 0.1 },
                  },
                  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <CardHeader className="space-y-2 text-center pt-8 pb-4">
                  <motion.div
                    variants={itemVariants}
                    className="flex justify-center mb-2"
                  >
                    <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                      <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-3xl font-bricolage font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Check your email
                    </CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-base">
                      We sent a 6-digit code to{" "}
                      <span className="text-foreground font-medium">
                        {email}
                      </span>
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <form onSubmit={handleVerify}>
                  <CardContent className="space-y-6 px-8">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                      >
                        <Alert variant="destructive" className="py-2.5">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    <motion.div
                      variants={itemVariants}
                      className="flex justify-center gap-2 pt-2"
                    >
                      {digits.map((digit, i) => (
                        <Input
                          key={i}
                          ref={(el) => {
                            digitRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(i, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(i, e)}
                          className="w-11 h-14 text-center text-xl font-bold rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                        />
                      ))}
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="flex justify-center pt-4 pb-4"
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 h-12 rounded-full font-bold text-md shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] transition-all hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>

                  <CardFooter className="flex flex-col pb-8">
                    <motion.p
                      variants={itemVariants}
                      className="text-center text-sm text-muted-foreground w-full mt-2"
                    >
                      Wrong email?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setStep("register");
                          setError(null);
                          setDigits(["", "", "", "", "", ""]);
                        }}
                        className="text-primary hover:text-primary/80 transition-colors font-semibold"
                      >
                        Go back
                      </button>
                    </motion.p>
                  </CardFooter>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
