import { Link } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Droplets, Users, MessageCircle, Shield, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGetContentGuidelines } from '../hooks/useQueries';
import { LoadingSkeleton, ErrorState } from '../components/state/QueryState';

export default function LandingPage() {
  const { isAuthenticated } = useCurrentUser();
  const { data: guidelines, isLoading: guidelinesLoading, error: guidelinesError } = useGetContentGuidelines();

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <section 
        className="relative py-16 sm:py-20 px-4 hero-gradient"
        style={{
          backgroundImage: 'url(/assets/generated/golden-water-hero-bg.dim_1920x1080.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/generated/golden-water-logo.dim_512x512.png" 
                alt="Golden Water" 
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Welcome to Golden Water
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              A lifestyle community celebrating wellness, mindfulness, and the golden moments in life. 
              Join us to share experiences, connect with like-minded individuals, and embrace the flow.
            </p>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full">
                <AlertCircle className="h-4 w-4" />
                <span>18+ Adults Only Community</span>
              </div>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link to="/feed">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Go to Feed
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/feed">
                    <Users className="mr-2 h-5 w-5" />
                    Join the Community
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">What We're About</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Droplets className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Flow & Wellness</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share your journey towards wellness and mindfulness. Discover practices that help you find your flow.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with others who appreciate the golden moments. Build meaningful relationships in a supportive space.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Safe Space</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A respectful community with clear guidelines. We prioritize kindness, authenticity, and mutual support.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Community Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guidelinesLoading && (
                <div className="space-y-2">
                  <LoadingSkeleton count={1} />
                </div>
              )}
              {guidelinesError && (
                <ErrorState message="Failed to load guidelines. Please try again." />
              )}
              {!guidelinesLoading && !guidelinesError && guidelines && (
                <>
                  <p className="text-muted-foreground">
                    {guidelines}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>• Be respectful and kind to all members</p>
                    <p>• Share authentic experiences and insights</p>
                    <p>• Keep content appropriate and non-explicit</p>
                    <p>• Report any content that violates our guidelines</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
