"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">BS</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            BookedSolid AI
          </CardTitle>
          <CardDescription className="text-lg">Welcome Back</CardDescription>
          <p className="text-sm text-muted-foreground">
            Log in to view your call analytics and performance
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                disabled={isPending}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Log In"}
            </Button>

            <div className="text-center text-sm text-muted-foreground space-x-4">
              <a href="#" className="hover:text-purple-600 transition-colors">
                Forgot password?
              </a>
              <span>|</span>
              <a href="#" className="hover:text-purple-600 transition-colors">
                Need help?
              </a>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs font-semibold text-blue-900 mb-2">Demo Account Credentials:</p>
              <p className="text-xs text-blue-700">
                <strong>Email:</strong> demo@bookedsolid.ai<br />
                <strong>Password:</strong> DemoClient2025!
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-2">
              <a href="/admin/login" className="hover:text-purple-600 transition-colors font-medium">
                Admin Login →
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
