import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth";
import { bootstrapUserProfile } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const session = authClient.useSession();

  if (session.isPending) {
    return null;
  }

  if (session.data) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { error: authError } = await authClient.signUp.email({ email, password, name });

    if (authError) {
      setError(authError.message);
      return;
    }

    try {
      await bootstrapUserProfile(name);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Failed to initialize profile");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center soft-gradient animate-in fade-in duration-700">
      <Card className="w-[22rem] p-8 shadow-medium bg-background">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold text-center flex items-center gap-2 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(176 52% 35%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="18" r="4" />
              <path d="M12 18V2l7 4" />
            </svg>
            Sign Up for Lyra
          </h1>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="bg-secondary/30 hover:bg-secondary/40 focus:bg-secondary/50 border-2 focus-visible:ring-0 focus-visible:border-primary/50 rounded-xl transition-all"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="bg-secondary/30 hover:bg-secondary/40 focus:bg-secondary/50 border-2 focus-visible:ring-0 focus-visible:border-primary/50 rounded-xl transition-all"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="bg-secondary/30 hover:bg-secondary/40 focus:bg-secondary/50 border-2 focus-visible:ring-0 focus-visible:border-primary/50 rounded-xl transition-all"
          />
          {error ? <p className="text-red-500 text-sm">{error}</p> : null}
          <Button type="submit" className="w-full hero-gradient hover:opacity-90 transition-all shadow-soft">
            Create Account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
}
