import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40 py-12 px-4">
      <div className="mx-auto max-w-3xl bg-white rounded-2xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 mb-4">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: February 21, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Solar ROI Calculator ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Solar ROI Calculator is a software-as-a-service (SaaS) platform designed for solar installers to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Calculate solar return on investment (ROI) for potential customers</li>
              <li>Generate solar installation proposals and quotes</li>
              <li>Manage customer leads and contact information</li>
              <li>Track and organize solar installation opportunities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed">To use the Service, you must:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, harvest, or collect user data without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Share your account credentials with unauthorized users</li>
              <li>Use the Service to spam or send unsolicited communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. ROI Calculations and Estimates</h2>
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
              <p className="text-gray-900 font-medium mb-2">⚠️ Important Disclaimer</p>
              <p className="text-gray-700 leading-relaxed">
                Solar ROI calculations provided by the Service are <strong>estimates only</strong> and should not be considered as guarantees or financial advice. Actual results may vary based on numerous factors including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Changes in energy rates and incentive programs</li>
                <li>Actual solar panel performance and degradation</li>
                <li>Weather conditions and sun exposure</li>
                <li>Installation quality and system maintenance</li>
                <li>Changes in energy consumption patterns</li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed mt-3">
              We recommend consulting with licensed solar professionals and financial advisors before making installation decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Customer Data and Lead Management</h2>
            <p className="text-gray-700 leading-relaxed">
              As a solar installer using our Service, you are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Obtaining proper consent from customers before collecting their information</li>
              <li>Complying with all applicable privacy laws and regulations</li>
              <li>Handling customer data securely and responsibly</li>
              <li>Providing accurate information in proposals and quotes</li>
              <li>Honoring quotes and commitments made to customers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service, including its software, design, content, and trademarks, is owned by Solar ROI Calculator and protected by intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Copy, modify, or distribute the Service or its content</li>
              <li>Reverse engineer or decompile the software</li>
              <li>Remove or alter copyright notices or branding</li>
              <li>Create derivative works based on the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Payment and Subscription (Future)</h2>
            <p className="text-gray-700 leading-relaxed">
              Currently, the Service is offered free of charge during its development phase. In the future, we may introduce paid subscription plans. If we do:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Existing users will be notified at least 30 days in advance</li>
              <li>Pricing and payment terms will be clearly communicated</li>
              <li>Users may choose to continue or cancel their accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Service Availability and Changes</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to maintain continuous service availability, but we do not guarantee uninterrupted access. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Modify, suspend, or discontinue any part of the Service</li>
              <li>Perform maintenance and updates without notice</li>
              <li>Change features, functionality, or pricing</li>
              <li>Terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>WE ARE NOT RESPONSIBLE FOR BUSINESS DECISIONS MADE BASED ON ROI CALCULATIONS</li>
              <li>WE ARE NOT LIABLE FOR DATA LOSS, SERVICE INTERRUPTIONS, OR THIRD-PARTY ACTIONS</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE (IF ANY)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Solar ROI Calculator from any claims, damages, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your interactions with customers or leads</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              You may terminate your account at any time by contacting us. We may terminate or suspend your account immediately if you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Violate these Terms</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Cause harm to other users or the Service</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Upon termination, your access will cease and we may delete your data after a reasonable period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws applicable in your jurisdiction, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Posting the updated Terms on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification (for significant changes)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="mt-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-gray-900 font-medium">Solar ROI Calculator</p>
              <p className="text-gray-700">Email: <a href="mailto:paulopackager@gmail.com" className="text-amber-600 hover:text-amber-700 underline">paulopackager@gmail.com</a></p>
              <p className="text-gray-700">Website: <a href="https://testingground.sbs" className="text-amber-600 hover:text-amber-700 underline">https://testingground.sbs</a></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
            <Link href="/" className="hover:text-amber-600">Home</Link>
            <Link href="/privacy" className="hover:text-amber-600">Privacy Policy</Link>
            <Link href="/auth/login" className="hover:text-amber-600">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
