export default function GoldWaterTrackerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
          Gold Water Tracker
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Track your daily water intake with this interactive tool
        </p>
        
        <div className="relative w-full bg-card rounded-lg shadow-lg overflow-hidden" style={{ paddingBottom: '75%' }}>
          <iframe
            src="https://quench-joy-flow.lovable.app/"
            title="Gold Water Tracker - Interactive water intake tracking tool"
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>This tracker helps you monitor your daily hydration goals.</p>
        </div>
      </div>
    </div>
  );
}
