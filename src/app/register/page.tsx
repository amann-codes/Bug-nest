"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FormValues = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

export default function TokenRegistration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{
    email: string;
    name: string;
    role?: string;
    userId?: string;
    managerId?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const password = watch("password");

  useEffect(() => {
    async function fetchInvitationDetails() {
      if (!token) {
        setIsLoadingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.FRONTEND_URL}/api/team/employee-invite?token=${token}`
        );
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          setUserDetails({
            email: data.data.email,
            name: data.data.name,
            role: data.data.role,
            userId: data.data.userId,
            managerId: data.data.managerIds,
          });

          setValue("email", data.data.email);
          setValue("name", data.data.name);
        } else {
          setTokenError(data.error || "Invalid invitation token");
        }
      } catch (error: any) {
        setTokenError(error.message || "Failed to validate invitation token");
      } finally {
        setIsLoadingToken(false);
      }
    }

    fetchInvitationDetails();
  }, [token, setValue]);

  if (!token) {
    setTimeout(() => {
      toast.error("Invalid registration link. No token provided.");
      router.push("/signin");
    }, 100);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Registration Error
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-center text-gray-600">
              Redirecting to sign-in page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Loading Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-center text-gray-600">
              Verifying your registration link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    setTimeout(() => {
      router.push("/signin");
    }, 3000);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Registration Error
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-center text-gray-600">{tokenError}</p>
            <p className="text-center text-gray-600 mt-2">
              Redirecting to sign-in page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    if (!token || !userDetails) {
      toast.error("Missing registration token or user details");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.FRONTEND_URL}/api/team/registeration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
          name: userDetails.name,
          email: userDetails.email,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast(
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Registerd Successfully</span>
            <span className="text-sm text-gray-500">
              Redirecting to sign-in page...
            </span>
          </div>
        );
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        toast.error(result.error || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Registration
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your details to complete registration
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={userDetails?.email || ""}
                readOnly
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={userDetails?.name || ""}
                readOnly
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters long",
                  },
                })}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords don't match",
                })}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Complete Registration"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
