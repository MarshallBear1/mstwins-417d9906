import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  complete your profile, or communicate with other users.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Personal Information: Name, email address, date of birth, location</li>
                  <li>Health Information: MS subtype, diagnosis year, symptoms, medications (optional)</li>
                  <li>Profile Information: Interests, hobbies, about me section, profile photos</li>
                  <li>Communication Data: Messages sent through our platform</li>
                  <li>Usage Data: How you interact with our platform and services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>To provide and maintain our services</li>
                  <li>To connect you with other community members</li>
                  <li>To send you notifications about matches and messages</li>
                  <li>To improve our platform and user experience</li>
                  <li>To ensure safety and security of our community</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties except:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>With other users as part of the normal operation of our platform (profile information only)</li>
                  <li>With service providers who assist in our operations</li>
                  <li>When required by law or to protect our rights and safety</li>
                  <li>In connection with a business transfer or sale</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Health Information Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  We understand the sensitive nature of health information. Your health-related data is:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Encrypted and stored securely</li>
                  <li>Only shared with matched users when you choose to disclose it</li>
                  <li>Never sold or used for advertising purposes</li>
                  <li>Handled in accordance with applicable healthcare privacy laws</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
                  secure servers, and regular security audits.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of non-essential communications</li>
                  <li>Request a copy of your data</li>
                  <li>File a complaint with supervisory authorities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at:{" "}
                  <a href="mailto:team@sharedgenes.org" className="text-primary hover:underline">
                    team@sharedgenes.org
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal data only as long as necessary to provide you with the service 
                  or as required by law. You may request deletion at any time by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to—and maintained on—servers located outside your 
                  country, including the United States. We ensure all data transfers comply with 
                  applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We may use cookies or similar technologies to enhance user experience, store preferences, 
                  and perform analytics. You can disable cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of significant 
                  changes by posting the new version on our website or sending a notification.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;