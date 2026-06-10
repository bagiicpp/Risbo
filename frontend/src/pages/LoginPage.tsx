import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";
import { useNavigate, Link } from "react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { motion, type Variants } from "framer-motion";

// shadcn/ui components
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

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 },
  },
};

// Add : Variants here
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await api.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(res.data.access_token);
      navigate("/chat");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Authentication failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background font-dmsans p-4 overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-6"
        >
          <img
            src="/logo-icon.png"
            alt="Risbo"
            className="w-16 h-16 object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          />
        </motion.div>

        <Card className="border-border/40 shadow-2xl bg-card/80 backdrop-blur-xl rounded-2xl">
          <CardHeader className="space-y-2 text-center pt-10 pb-6">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-bricolage font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-base">
                Enter your credentials to continue
              </CardDescription>
            </motion.div>
          </CardHeader>

          <form onSubmit={handleLogin}>
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
                  <Label htmlFor="email" className="text-muted-foreground ml-1">
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
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-muted-foreground">
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 h-12 rounded-xl border-border/50 focus:bg-background tracking-widest transition-colors"
                  />
                </motion.div>
              </div>

              {/* Centered, shrunken button with padding */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center py-8"
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 h-12 rounded-full font-bold text-md shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] transition-all hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
            </CardContent>

            <CardFooter className="flex flex-col pb-10">
              <motion.p
                variants={itemVariants}
                className="text-center text-sm text-muted-foreground w-full mt-2"
              >
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  Create one
                </Link>
              </motion.p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
