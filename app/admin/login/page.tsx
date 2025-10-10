"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-slate-200">Admin Email</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@bookedsolid.ai"
                required
                disabled={isPending}
                autoComplete="email"
                className="bg-slate-900/50 border-slate-600 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-slate-200">Admin Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
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
              disabled={isPending}
            >
              {isPending ? "Logging in..." : "Admin Log In"}
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
