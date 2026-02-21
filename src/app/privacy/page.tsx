import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40 py-12 px-4">
      <div className="mx-auto max-w-3xl bg-white rounded-2xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 mb-4">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: February 21, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Solar ROI Calculator ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our solar ROI calculator service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Personal Information</h3>
            <p className="text-gray-700 leading-relaxed">We collect the following personal information:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Name and email address when you create an account</li>
              <li>Google profile information when you sign in with Google (name, email, profile picture)</li>
              <li>Contact information for solar installation leads</li>
              <li>Property address and energy usage data for ROI calculations</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Usage Data</h3>
            <p className="text-gray-700 leading-relaxed">We automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Browser type and version</li>
              <li>IP address and device information</li>
              <li>Pages visited and time spent on our service</li>
              <li>Solar ROI calculation parameters and results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide and maintain our solar ROI calculator service</li>
              <li>Create and manage your installer account</li>
              <li>Process and manage solar installation leads</li>
              <li>Send email notifications about leads and quotes</li>
              <li>Improve our service and develop new features</li>
              <li>Communicate with you about updates and support</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed"><strong>We do not sell your personal information.</strong> We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Service Providers:</strong> We use Supabase for authentication and database hosting, and Vercel for application hosting</li>
              <li><strong>Google Services:</strong> When you use Google Sign-In, we receive basic profile information from Google</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Encryption of data in transit using HTTPS/TLS</li>
              <li>Secure authentication via Supabase with password hashing</li>
              <li>Row-level security policies in our database</li>
              <li>Regular security updates and monitoring</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails at any time</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, please contact us at <a href="mailto:paulopackager@gmail.com" className="text-amber-600 hover:text-amber-700 underline">paulopackager@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to maintain your session and improve user experience. You can control cookies through your browser settings, but disabling them may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">Our service integrates with:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Google OAuth:</strong> For Google Sign-In authentication</li>
              <li><strong>Google Places API:</strong> For address autocomplete</li>
              <li><strong>Supabase:</strong> For database and authentication services</li>
              <li><strong>Vercel:</strong> For application hosting</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              These services have their own privacy policies. We recommend reviewing them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Continued use of our service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
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
            <Link href="/terms" className="hover:text-amber-600">Terms of Service</Link>
            <Link href="/auth/login" className="hover:text-amber-600">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
