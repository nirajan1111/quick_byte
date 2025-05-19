
import React, { useState } from 'react';
import Header from '@/components/Header';
import OnboardingSteps from '@/components/OnboardingSteps';
import RestaurantCard, { Restaurant } from '@/components/RestaurantCard';
import { fetchRestaurants } from '@/services/restaurantService';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [userPreferences, setUserPreferences] = useState<{
    cuisines: string[];
    location: { address: string; lat?: number; lng?: number };
  } | null>(null);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOnboardingComplete = async (preferences: {
    cuisines: string[];
    location: { address: string; lat?: number; lng?: number };
  }) => {
    setUserPreferences(preferences);
    setIsLoading(true);
    
    try {
      const restaurantData = await fetchRestaurants(
        preferences.cuisines,
        preferences.location
      );
      
      setRestaurants(restaurantData);
      setCurrentRestaurantIndex(0);
      setIsLoading(false);
      
      if (restaurantData.length === 0) {
        toast({
          title: "No restaurants found",
          description: "Try different cuisines or location",
          variant: "destructive",
        });
        setUserPreferences(null);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setIsLoading(false);
      toast({
        title: "Oops! Something went wrong",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleTryAnother = () => {
    if (currentRestaurantIndex < restaurants.length - 1) {
      setCurrentRestaurantIndex((prev) => prev + 1);
    } else {
      setCurrentRestaurantIndex(0);
      toast({
        title: "Starting over",
        description: "You've seen all suggestions, showing them again",
      });
    }
  };

  const handleRestart = () => {
    setUserPreferences(null);
    setRestaurants([]);
    setCurrentRestaurantIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-quickbite-purple-soft">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-quickbite-black">
            Discover Your Next <span className="text-quickbite-purple">Favorite Restaurant</span>
          </h1>
          <p className="text-lg md:text-xl text-quickbite-gray-neutral">
            Finding the perfect place to eat has never been easier
          </p>
        </div>
        
        {!userPreferences ? (
          <OnboardingSteps onComplete={handleOnboardingComplete} />
        ) : (
          <div>
            <div className="mb-6 flex justify-center">
              <button 
                onClick={handleRestart}
                className="text-quickbite-purple-dark hover:text-quickbite-purple flex items-center underline"
              >
                Start Over
              </button>
            </div>
            
            {isLoading ? (
              <RestaurantCard 
                restaurant={{ 
                  id: 'loading',
                  name: 'Loading',
                  rating: 0,
                  address: '',
                  cuisines: []
                }} 
                onTryAnother={() => {}} 
                isLoading={true}
              />
            ) : (
              restaurants.length > 0 && (
                <RestaurantCard 
                  restaurant={restaurants[currentRestaurantIndex]} 
                  onTryAnother={handleTryAnother} 
                />
              )
            )}
          </div>
        )}
      </div>
      
      <footer className="mt-16 py-8 bg-quickbite-black text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2025 QuickBite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
