import Link from "next/link";
import { ArrowRight, QrCode, Lock, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Meet Kare-n</h1>
          <p className="text-xl text-gray-600 mb-2">Because we kare</p>
          <p className="text-lg text-gray-500">
            Your friendly AI-powered robot assistant
          </p>
        </div>

        <div className="grid gap-8 mb-16">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 1: Meet Your Robot Assistant
                </h2>
                <p className="text-gray-600 mb-4">
                  Look for Kare-n, our friendly robot assistant, as she moves
                  around the restaurant. She'll display a QR code on her screen
                  that you can scan to connect directly with her AI brain.
                </p>
                <Link
                  href="/waiter"
                  className="inline-flex items-center text-sm font-medium text-black hover:text-gray-700"
                >
                  See Demo
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 2: Quick Connection
                </h2>
                <p className="text-gray-600">
                  A simple sign-in helps Kare-n remember your preferences and
                  previous visits, allowing her to provide personalized
                  recommendations and better service every time you return.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 3: Natural Conversation
                </h2>
                <p className="text-gray-600">
                  Chat naturally with Kare-n about our menu. She remembers your
                  past orders, understands your preferences, and can make
                  personalized recommendations. Whether you're a regular or
                  first-time visitor, she'll help you discover the perfect dish.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/waiter"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Meet Kare-n
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
