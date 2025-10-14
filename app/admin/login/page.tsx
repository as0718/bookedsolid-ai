"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid admin credentials");
        setLoading(false);
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/admin/dashboard" });
    } catch {
      setError("An error occurred with Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-slate-400 text-lg">
            Admin Access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign-In Button */}
          <div className="space-y-4 mb-4">
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-slate-600 bg-slate-900/50 hover:bg-slate-700/50 text-slate-100"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800/50 px-2 text-slate-400">Or continue with email</span>
              </div>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-slate-200">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@bookedsolid.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="bg-slate-900/50 border-slate-600 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-slate-200">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="bg-slate-900/50 border-slate-600 text-slate-100"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-700 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Admin Log In"}
            </Button>

            <div className="mt-6 p-4 bg-slate-900/50 border border-slate-600 rounded-md">
              <p className="text-xs font-semibold text-slate-300 mb-2">Demo Admin Credentials:</p>
              <p className="text-xs text-slate-400">
                <strong>Email:</strong> admin@bookedsolid.ai<br />
                <strong>Password:</strong> AdminAccess2025!
              </p>
            </div>

            <div className="text-center text-xs text-slate-400 pt-2">
              <a href="/login" className="hover:text-amber-400 transition-colors font-medium">
                ← Client Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
