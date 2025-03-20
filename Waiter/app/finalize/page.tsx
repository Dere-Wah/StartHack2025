"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinalizePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/waiter");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Thank you for the order. We're processing it
        </h1>
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
