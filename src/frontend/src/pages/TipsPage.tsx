import { Droplet, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function TipsPage() {
  const tips = [
    'Drink when you feel thirsty.',
    'Keep a reusable water bottle with you.',
    'Start your day with a glass of water.',
    'Add lemon, cucumber or berries for flavor.',
    'Choose water over sugary drinks.',
    'Eat water-rich foods like melon or cucumbers.',
    'Aim for pale-yellow urine as a hydration guide.',
    'Sip water during meals.',
    'Set small reminders if you forget to drink.',
  ];

  const urineFacts = [
    'Urine is about 95% water.',
    'Its yellow color comes from a pigment called urochrome.',
    'You make around 3 to 8 cups per day.',
    'Morning urine is darker because it is more concentrated.',
    'Food can change it; asparagus affects smell and beets may turn it pink.',
    'Dark urine usually means you need more water.',
    'Bladders hold roughly 1.5 to 2 cups.',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-4">
            <Droplet className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Hydration Tips
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, healthy habits to help you stay hydrated throughout the day
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Daily Hydration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed pt-0.5">
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-8 sm:mt-12">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Info className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Urine Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {urineFacts.map((fact, index) => (
                <li key={index} className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed pt-0.5">
                    {fact}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 sm:mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm sm:text-base text-muted-foreground">
                Remember: Everyone's hydration needs are different. Listen to your body and adjust your water intake based on your activity level, climate, and overall health.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
