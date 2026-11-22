import React, { useState } from "react";
import { LockKeyhole, Mail, User, ChevronDown } from "lucide-react";
import { Text } from "../components/ui/Text";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/Password";
import { Button } from "../components/ui/Button";
import { Anchor } from "../components/ui/Anchor";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase/config";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [lengthError, setLengthError] = useState(false);
  const [teamName, setTeamName] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setLengthError(true);
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        username,
        teamName,
        role: "user",
        isApproved: false,
        createdAt: serverTimestamp(),
      });

      navigate("/user");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-fifa-bg px-4 py-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-fifa-border bg-fifa-surface p-5 sm:p-8">

        {/* Title */}
        <div className="text-center">
          <Text className="font-inter text-[10px] uppercase tracking-[0.2em] text-fifa-accent block mb-2">
            Auction22
          </Text>
          <Text variant="heading" className="font-[orbitron] text-fifa-text text-2xl md:text-3xl">
            Join the Squad
          </Text>
          <Text className="mt-2 font-inter text-fifa-text-secondary text-sm">
            Register to start bidding
          </Text>
        </div>

        {error && (
          <Text role="alert" className="w-full rounded-lg border border-fifa-danger/25 bg-fifa-danger/[0.05] px-4 py-3 text-center font-inter text-sm text-fifa-danger">
            {error}
          </Text>
        )}

        <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={handleSignup}>
          <Input
            type="text"
            placeholder="Username"
            icon={<User size={18} className="text-fifa-text-muted" />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            type="email"
            placeholder="Email"
            icon={<Mail size={18} className="text-fifa-text-muted" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <select
              className="font-inter text-sm text-fifa-text w-full block border border-fifa-border px-4 py-2.5 rounded-xl bg-fifa-surface appearance-none focus:outline-none focus:border-fifa-accent/60"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            >
              <option value="" disabled>Select Team Name</option>
              <option value="FC Bayern Munich">FC Bayern Munich</option>
              <option value="Manchester City F.C.">Manchester City F.C.</option>
              <option value="Wolverhampton Wanderers F.C.">Wolverhampton Wanderers F.C.</option>
              <option value="Liverpool FC">Liverpool FC</option>
              <option value="Manchester United F.C.">Manchester United F.C.</option>
              <option value="Paris Saint-Germain F.C.">Paris Saint-Germain F.C.</option>
              <option value="Arsenal F.C.">Arsenal F.C.</option>
              <option value="Real Madrid C.F.">Real Madrid C.F.</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-fifa-text-muted pointer-events-none"
            />
          </div>

          <PasswordInput
            placeholder="Password"
            icon={<LockKeyhole size={18} className="text-fifa-text-muted" />}
            error={lengthError && "Password must be at least 6 characters"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLengthError(e.target.value.length < 6);
            }}
          />

          <Button
            type="submit"
            className="w-full bg-fifa-accent hover:bg-fifa-accent-hover active:bg-fifa-accent-active text-fifa-bg font-inter font-medium rounded-xl py-3"
          >
            Sign Up
          </Button>
        </form>

        <Text className="font-inter text-fifa-text-secondary text-sm">
          Already have an account?{" "}
          <Anchor to="/login" className="text-fifa-accent hover:text-fifa-accent-hover">
            Log in
          </Anchor>
        </Text>
      </div>
    </div>
  );
};

export default Signup;
