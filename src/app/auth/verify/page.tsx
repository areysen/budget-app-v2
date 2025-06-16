import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Check Your Email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent you a magic link. Click the link in your email to sign in
            to your account.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <Button
            asChild
            className="w-full bg-primary text-white rounded-md px-6 py-3 font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
