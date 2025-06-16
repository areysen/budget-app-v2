import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-soft flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-border/50 rounded-2xl p-6 shadow-sm">
          {children}
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
