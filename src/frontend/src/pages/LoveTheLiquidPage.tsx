import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart } from 'lucide-react';

export default function LoveTheLiquidPage() {
  const kofiUrl = 'https://ko-fi.com/painparadise';

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-primary fill-primary" />
            LOVE THE LIQUID
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-primary fill-primary" />
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Support Golden Water and help keep the community flowing! Your contributions help maintain and improve this platform.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="text-center text-xl sm:text-2xl">Support on Ko-fi</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Every contribution helps us keep Golden Water running smoothly and ad-free. Thank you for your support!
              </p>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto min-w-[200px]"
              >
                <a
                  href={kofiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Heart className="h-5 w-5 fill-current" />
                  Support on Ko-fi
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="aspect-[16/9] sm:aspect-[16/10] w-full">
                <iframe
                  src={`${kofiUrl}/?hidefeed=true&widget=true&embed=true`}
                  className="w-full h-full border-0"
                  title="Ko-fi Donation Widget"
                  allow="payment"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Secure payments powered by Ko-fi</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Support?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Keep the platform ad-free and user-focused</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Support ongoing development and new features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Help maintain server costs and infrastructure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Show appreciation for the community</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
