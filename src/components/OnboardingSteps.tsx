
import React, { useState } from 'react';
import CuisineSelection from './CuisineSelection';
import LocationInput from './LocationInput';
import ProgressBar from './ProgressBar';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStepsProps {
  onComplete: (preferences: {
    cuisines: string[];
    location: {
      address: string;
      lat?: number;
      lng?: number;
    };
    radius: number;
  }) => void;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({onComplete}) => {
  const [step, setStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [radius, setRadius] = useState(5000);
  const [location, setLocation] = useState<{
    address: string;
    lat?: number;
    lng?: number;
  }>({address: ""});
  const {toast} = useToast();

  const totalSteps = 2;

  const handleCuisineNext = () => {
    if (selectedCuisines.length === 0) {
      toast({
        title: "Please select at least one cuisine",
        description: "Or choose 'Surprise Me' for random selections",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleLocationBack = () => {
    setStep(1);
  };

  const handleLocationComplete = (locationData: {
    address: string;
    lat?: number;
    lng?: number;
  }) => {
    if (!locationData.address) {
      toast({
        title: "Please enter a location",
        description: "Or use your current location",
        variant: "destructive",
      });
      return;
    }

    setLocation(locationData);
    onComplete({
      cuisines: selectedCuisines,
      location: locationData,
      radius: radius,
    });
  };

  const handleSurpriseMe = () => {
    setSelectedCuisines(["surprise"]);
    setStep(2);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <ProgressBar currentStep={step} totalSteps={totalSteps} />

      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
            What cuisine would you like to try?
          </h2>
          <CuisineSelection
            selectedCuisines={selectedCuisines}
            onSelectionChange={setSelectedCuisines}
          />
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <button className="btn-secondary" onClick={handleSurpriseMe}>
              Surprise Me
            </button>
            <button className="btn-primary" onClick={handleCuisineNext}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
            Where would you like to eat?
          </h2>
          <LocationInput
            onBack={handleLocationBack}
            onComplete={handleLocationComplete}
          />
        </div>
      )}
    </div>
  );
};

export default OnboardingSteps;
