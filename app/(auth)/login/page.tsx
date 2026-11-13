"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/auth-store";

const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(3, "Please enter your email or username"),
  password: z
    .string()
    .min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/workspace";
  const isExpired = searchParams.get("expired") === "1";

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(
    isExpired ? "Your session has expired. Please sign in again." : null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: values.emailOrUsername.trim(),
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      if (data.user) {
        setUser(data.user);
      }

      toast.success("Welcome back!", {
        description: `Signed in as ${data.user?.fullName || values.emailOrUsername}`,
      });

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Failed to sign in. Please verify your credentials.";
      setServerError(message);
      toast.error("Authentication failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your credentials to access your NexoChat workspace.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email or Username */}
        <div className="space-y-1.5">
          <label
            htmlFor="emailOrUsername"
            className="block text-xs font-semibold text-slate-700"
          >
            Email or Username
          </label>
          <Input
            id="emailOrUsername"
            type="text"
            placeholder="name@company.com or username"
            autoComplete="username"
            disabled={isSubmitting}
            className={errors.emailOrUsername ? "border-rose-400 focus-visible:ring-rose-400" : ""}
            {...register("emailOrUsername")}
          />
          {errors.emailOrUsername && (
            <p className="text-xs text-rose-600 font-medium mt-1">
              {errors.emailOrUsername.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              className={`pr-10 ${errors.password ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600 font-medium mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              {...register("rememberMe")}
            />
            <span className="text-xs text-slate-600 font-medium">
              Keep me signed in on this computer
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 font-medium shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In to Workspace"
            )}
          </Button>
        </div>
      </form>

      {/* Footer link to Register */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
