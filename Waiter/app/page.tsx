import Link from "next/link";
import { ArrowRight, QrCode, Lock, Smartphone } from "lucide-react";
//v0
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            QR Code Authentication System
          </h1>
          <p className="text-xl text-gray-600">
            A simple and secure way to authenticate users using QR codes
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
                  Step 1: Generate QR Code
                </h2>
                <p className="text-gray-600 mb-4">
                  Visit the waiter page to generate a unique QR code for
                  authentication. The system will establish a secure connection
                  and wait for user authentication.
                </p>
                <Link
                  href="/waiter"
                  className="inline-flex items-center text-sm font-medium text-black hover:text-gray-700"
                >
                  Go to Waiter Page
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
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
                  Step 2: Scan QR Code
                </h2>
                <p className="text-gray-600">
                  Using a mobile device, scan the generated QR code. This will
                  redirect you to the identification page with a unique session
                  ID.
                </p>
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
                  Step 3: Authenticate
                </h2>
                <p className="text-gray-600">
                  Enter your credentials on the identification page. Once
                  authenticated, the waiter page will automatically update to
                  reflect your successful login.
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
            Start Authentication
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
