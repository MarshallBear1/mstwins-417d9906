import { Mail, MapPin, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  return (
    <>
      <SEO 
        title="Contact Us - MSTwins Community"
        description="Get in touch with the MSTwins team. Contact us for support, questions, or feedback about our MS community platform."
      />
      
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Contact Us
              </h1>
              <p className="text-lg text-muted-foreground">
                We're here to help connect and support our MS community
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-primary" />
                      Get in Touch
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">General Inquiries</p>
                        <a 
                          href="mailto:team@sharedgenes.org" 
                          className="text-primary hover:underline"
                        >
                          team@sharedgenes.org
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Community Support</p>
                        <p className="text-sm text-muted-foreground">
                          Questions about profiles, matches, or community features
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-sm text-muted-foreground">
                          We typically respond within 24-48 hours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>About MSTwins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      MSTwins is a supportive community platform designed specifically for 
                      people living with Multiple Sclerosis. We understand the importance of 
                      connection, shared experiences, and mutual support in navigating life with MS.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Quick Contact:</strong> For the fastest response, 
                          email us directly at{" "}
                          <a 
                            href="mailto:team@sharedgenes.org" 
                            className="font-medium underline"
                          >
                            team@sharedgenes.org
                          </a>
                        </p>
                      </div>

                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p><strong>For technical issues:</strong> Please include your username and a description of the problem.</p>
                        <p><strong>For community questions:</strong> We're here to help you make the most of your MSTwins experience.</p>
                        <p><strong>For partnerships:</strong> We welcome collaboration opportunities that benefit the MS community.</p>
                      </div>

                      <Button 
                        onClick={() => window.location.href = 'mailto:team@sharedgenes.org?subject=MSTwins Contact'} 
                        className="w-full bg-gradient-primary hover:opacity-90"
                        size="lg"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Community Guidelines</h3>
                    <p className="text-sm text-muted-foreground">
                      MSTwins is built on respect, empathy, and mutual support. 
                      We maintain a safe space where everyone can share their 
                      experiences and connect meaningfully with others who 
                      understand the MS journey.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Contact;