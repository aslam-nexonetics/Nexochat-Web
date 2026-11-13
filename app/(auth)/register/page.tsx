"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          username: values.username.trim(),
          phone: values.phone?.trim() || undefined,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully!", {
        description: "Please sign in with your new credentials.",
      });

      router.push("/login");
    } catch (err: any) {
      const message = err.message || "Failed to create account. Please try again.";
      setServerError(message);
      toast.error("Registration error", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create an Account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Join your organization&apos;s workspace on NexoChat.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="firstName"
              className="block text-xs font-semibold text-slate-700"
            >
              First Name
            </label>
            <Input
              id="firstName"
              placeholder="Jane"
              disabled={isSubmitting}
              className={errors.firstName ? "border-rose-400" : ""}
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="lastName"
              className="block text-xs font-semibold text-slate-700"
            >
              Last Name
            </label>
            <Input
              id="lastName"
              placeholder="Doe"
              disabled={isSubmitting}
              className={errors.lastName ? "border-rose-400" : ""}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700"
          >
            Work Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
            disabled={isSubmitting}
            className={errors.email ? "border-rose-400" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-rose-600 font-medium mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Username & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-slate-700"
            >
              Username
            </label>
            <Input
              id="username"
              placeholder="janedoe"
              disabled={isSubmitting}
              className={errors.username ? "border-rose-400" : ""}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-rose-600 font-medium mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="block text-xs font-semibold text-slate-700"
            >
              Phone (Optional)
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              disabled={isSubmitting}
              className={errors.phone ? "border-rose-400" : ""}
              {...register("phone")}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isSubmitting}
              className={`pr-10 ${errors.password ? "border-rose-400" : ""}`}
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-slate-700"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isSubmitting}
            className={errors.confirmPassword ? "border-rose-400" : ""}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-rose-600 font-medium mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 font-medium shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </div>
      </form>

      {/* Footer link to Login */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
