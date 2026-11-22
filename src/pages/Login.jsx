import React, { useState, useEffect } from "react";
import { Mail, LockKeyhole } from "lucide-react";
import { Text } from "../components/ui/Text";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/Password";
import { Button } from "../components/ui/Button";
import { Anchor } from "../components/ui/Anchor";

import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase/config";
import { useAuth } from "../context/AuthContext";
import Loadin from "../components/ui/loadin";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && userData) {
      if (userData.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    }
  }, [user, userData, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later");
          break;
        default:
          setError("Something went wrong. Try again");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fifa-bg text-fifa-text">
        <Loadin>Loading is fun</Loadin>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-fifa-bg px-4 py-8">
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-fifa-border bg-fifa-surface p-5 sm:p-8">

        {/* Title */}
        <div className="text-center">
          <Text className="font-inter text-[10px] uppercase tracking-[0.2em] text-fifa-accent block mb-2">
            Auction22
          </Text>
          <Text variant="heading" className="font-[orbitron] text-fifa-text text-2xl md:text-3xl">
            Welcome Back
          </Text>
          <Text className="mt-2 font-inter text-fifa-text-secondary text-sm">
            Sign in to place your bids
          </Text>
        </div>

        {error && (
          <Text role="alert" className="w-full rounded-lg border border-fifa-danger/25 bg-fifa-danger/[0.05] px-4 py-3 text-center font-inter text-sm text-fifa-danger">
            {error}
          </Text>
        )}

        {/* Form */}
        <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            icon={<Mail size={18} className="text-fifa-text-muted" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            placeholder="Enter your password"
            icon={<LockKeyhole size={18} className="text-fifa-text-muted" />}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <div className="flex items-center justify-between text-sm font-inter text-fifa-text-secondary">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-fifa-accent" />
              Remember me
            </label>
            <Anchor to="#" className="text-fifa-accent hover:text-fifa-accent-hover">
              Forgot password?
            </Anchor>
          </div>

          <Button
            type="submit"
            className="w-full bg-fifa-accent hover:bg-fifa-accent-hover active:bg-fifa-accent-active text-fifa-bg font-inter font-medium rounded-xl py-3"
          >
            Sign In
          </Button>

          <Text className="mt-2 font-inter text-fifa-text-secondary text-sm text-center">
            Don't have an account?{" "}
            <Anchor to="/signup">
              <span className="font-inter font-medium text-fifa-accent hover:text-fifa-accent-hover">
                Sign Up
              </span>
            </Anchor>
          </Text>
        </form>
      </div>
    </div>
  );
};

export default Login;