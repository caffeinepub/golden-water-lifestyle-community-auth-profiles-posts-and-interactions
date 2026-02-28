import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function FactsPage() {
  const humanUrineFacts = [
    'Fresh human urine leaves the body at about 98.6°F and cools rapidly once exposed to air.',
    'Labs reject urine samples if they aren\'t between 90°F and 100°F within four minutes of collection.',
    'Human urine contains over 3,000 chemicals, making it one of the most information-dense fluids in the body.',
    'Kidneys filter roughly 200 liters of blood per day to create urine.',
    'A urinalysis can reveal early signs of kidney disease, diabetes, liver issues, and infections.',
    'Human urine naturally varies in pH from about 4.6 to 8.0 depending on diet.',
    'Morning urine is the most concentrated because kidneys work overnight without added hydration.',
    'The yellow color mostly comes from urochrome, produced when old red blood cells break down.',
    'Healthy kidneys prevent protein from entering urine; protein in urine often means kidney damage.',
    'High potassium buildup occurs when you cannot urinate, making retention a medical emergency.',
    'Urine is not sterile, even inside the bladder; it normally contains trace bacteria.',
    'Healthy urine is 95 percent water, the rest is urea, uric acid, salts, hormones, vitamins, and metabolites.',
    'Urine can contain hundreds of microscopic particles, including crystals and protein fragments.',
    'Excess dietary protein leads to high nitrogen in urine, which contributes to environmental pollution.',
    'Scientists recently found tire-derived chemicals like 6PPD-quinone in 60–100 percent of tested human urine samples.',
    'Your kidneys filter your entire blood volume about 60 times per day, continuously producing urine.',
    'A panel of urine metabolites can reveal diet, exercise, medications, alcohol intake, and early disease signals.',
    'New methods can convert human urine into hydroxyapatite, the mineral used in bones and teeth.',
    'Urine tests (urinalysis) can detect diabetes, kidney disease, liver disease, infections, cancer markers, and more.',
    'Dark, strong-smelling urine usually means dehydration.',
    'Cloudy or foamy urine can signal infection or kidney dysfunction.',
    'Urine metabolomics now analyzes 3,000+ chemicals, making it one of the most information-rich body fluids.',
    'Smart toilets are being developed to monitor urine chemistry for real-time health tracking.',
    'Humans produce 1–2 quarts of urine per day, depending on hydration.',
    'Urine is 91–96 percent water; the rest is urea, salts, hormones, and metabolic waste.',
    'Kidneys filter about 48 gallons of blood per day, with urine as the final waste product.',
    'Your bladder signals the urge to pee at around 150 ml, but can hold up to 500 ml.',
    'Urea in human urine has been used to make fertilizer, soap, and laundry agents throughout history.',
    'Researchers can detect coffee, alcohol, medications, supplements, exercise, and even some tumors by analyzing urine metabolites.',
    'A 2025 bladder transplant was considered successful because the patient\'s urine drained normally into the new organ.',
    'A panel of 69 specific urine metabolites can help detect precancerous colon polyps.',
    'Urine color changes mostly reflect hydration and red blood cell breakdown products, especially urochrome.',
    'Urine pH can vary widely: 4.5 to 8.0, depending on diet and kidney function.',
    'Urine must reach at least 400 ml/day; less may indicate dehydration or kidney failure.',
    'Some medicines and foods can turn urine orange, red, green, blue, or brown.',
    'After eating beets, some people experience beeturia (pink or red urine) due to genetics.',
    'Modern studies show urine can contain trace microplastics and tire-derived chemicals like 6PPD-quinone, found in 60–100 percent of tested human samples.',
    'Healthy adults pass roughly 320 million microscopic particles in their urine each day, including crystals, cell fragments, and protein aggregates.',
    'Urine carries over 3,000 known chemicals, representing about two-thirds of all chemical classes found in the human body.',
    'The kidneys filter your entire blood volume about 60 times per day, producing urine continuously even while you sleep.',
    'Human urine volume ranges from 0.8 to 2 liters per day, but must reach at least 400 ml to safely remove waste.',
    'Urine pH can vary more than 1,000-fold, shifting between 4.5 and 8.0 depending on diet and kidney function.',
    'Urine analysis is considered a "liquid biopsy," able to reveal DNA, RNA, proteins, metabolites, and early signs of disease.',
    'Some metabolites in urine can now indicate biological age, cancer risk, hormone levels, or the presence of infections.',
    'Aged human urine can act as a fertilizer and pesticide due to its nitrogen content and strong natural smell.',
    'In chronic kidney disease research, urine provides more detailed biological information about the kidneys than blood.',
    'Urine glows under a blacklight because of phosphorus.',
    'In the 1950s, pregnancy tests used frogs: doctors injected urine and waited to see if the frog laid eggs.',
    'Ancient doctors checked for diabetes by tasting urine for sweetness.',
    'Most mammals, big or small, take about 21 seconds to pee.',
    'Asparagus changes urine smell, but only some people can actually smell it due to genetics.',
    'Ancient Romans collected urine for cleaning and whitening, due to ammonia.',
    'Human urine can be processed into hydroxyapatite, the same mineral found in bones and teeth.',
    'Drinking urine is unsafe because the salt and waste products dehydrate you further.',
    'Beets can turn urine red or pink (this is called beeturia).',
    'Smells can change depending on food: asparagus, coffee, onions, and spices.',
    'Hydration, diet, medicines, sweating, and temperature all affect how much you pee.',
    'A new 2025 method can estimate your biological age from patterns in urine microRNA.',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-4">
            <Info className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Human Urine Facts
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Fascinating scientific facts about human urine and kidney function
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Info className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Did You Know?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {humanUrineFacts.map((fact, index) => (
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
                These facts are based on scientific research and medical studies. Urine analysis continues to be an important diagnostic tool in modern medicine.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
