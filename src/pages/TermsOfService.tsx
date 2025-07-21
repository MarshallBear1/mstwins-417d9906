import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using MSTwins, you agree to be bound by these Terms of Service and our Privacy Policy. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground mb-4">
                  MSTwins is a community platform designed to connect individuals living with Multiple Sclerosis. 
                  Our service facilitates:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Building supportive friendships within the MS community</li>
                  <li>Sharing experiences and resources</li>
                  <li>Providing a safe space for connection and support</li>
                  <li>Facilitating communication between community members</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Important:</strong> MSTwins is not a dating platform and is not intended for romantic relationships.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Eligibility</h2>
                <p className="text-muted-foreground mb-4">To use MSTwins, you must:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Be at least 18 years old</li>
                  <li>Have a connection to the MS community (personal diagnosis, caregiver, or supporter)</li>
                  <li>Provide accurate and truthful information</li>
                  <li>Agree to use the platform for its intended purpose of community building</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Community Standards</h2>
                <p className="text-muted-foreground mb-4">All users must:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Be respectful and kind to all community members</li>
                  <li>Not harass, bully, or discriminate against others</li>
                  <li>Not share inappropriate, offensive, or harmful content</li>
                  <li>Respect others&apos; privacy and personal information</li>
                  <li>Not use the platform for commercial purposes without permission</li>
                  <li>Not attempt to circumvent safety measures or violate platform integrity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Medical Disclaimer</h2>
                <p className="text-muted-foreground">
                  MSTwins is not a medical service and does not provide medical advice, diagnosis, or treatment. 
                  Information shared on our platform should not be considered medical advice. Always consult 
                  with qualified healthcare professionals for medical guidance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Prohibited Activities</h2>
                <p className="text-muted-foreground mb-4">Users may not:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Create fake profiles or impersonate others</li>
                  <li>Attempt to find romantic or sexual connections</li>
                  <li>Share personal contact information until a secure connection is established</li>
                  <li>Spam, solicit, or engage in commercial activities</li>
                  <li>Share false medical information or unproven treatments</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Account Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate accounts that violate these terms, engage in 
                  harmful behavior, or use the platform inappropriately. Users may also delete their accounts 
                  at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  MSTwins is provided "as is" without warranties of any kind. We are not liable for any damages 
                  arising from your use of the platform, interactions with other users, or any content shared 
                  on the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We may update these Terms of Service from time to time. We will notify users of significant 
                  changes and continued use of the service constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Information</h2>
                <p className="text-muted-foreground">
                  Questions about these Terms of Service? Contact us at:{" "}
                  <a href="mailto:team@sharedgenes.org" className="text-primary hover:underline">
                    team@sharedgenes.org
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;