import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            There was a problem with your authentication attempt. This could be
            due to an expired or invalid magic link.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Button
            asChild
            className="w-full bg-primary text-white rounded-md px-6 py-3 font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <Link href="/auth/login">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
