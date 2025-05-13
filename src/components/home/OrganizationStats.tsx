
import { useState, useEffect } from "react";

const stats = [
  { value: 250, label: "Projects Completed" },
  { value: 1500, label: "Volunteers" },
  { value: 25, label: "Partner Organizations" },
  { value: 18000, label: "Hours Contributed" },
];

export function OrganizationStats() {
  const [animatedStats, setAnimatedStats] = useState<number[]>(stats.map(() => 0));
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("stats-section");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const intervals = stats.map((stat, index) => {
      const duration = 2000; // 2 seconds for animation
      const step = stat.value / (duration / 16); // 60fps
      
      let current = 0;
      
      return setInterval(() => {
        current += step;
        
        if (current >= stat.value) {
          current = stat.value;
          clearInterval(intervals[index]);
        }
        
        setAnimatedStats((prev) => {
          const newStats = [...prev];
          newStats[index] = Math.floor(current);
          return newStats;
        });
      }, 16);
    });

    return () => intervals.forEach(clearInterval);
  }, [isVisible]);

  return (
    <section id="stats-section" className="py-16 px-4 bg-muted">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Our Impact</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Together, we're making a difference. See our community's impact in numbers.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 bg-card rounded-lg shadow-md">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {animatedStats[index].toLocaleString()}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
