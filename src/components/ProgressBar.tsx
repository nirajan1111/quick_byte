
import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-1">
        {[...Array(totalSteps)].map((_, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-center h-8 w-8 rounded-full 
              ${index + 1 <= currentStep 
                ? 'bg-quickbite-purple text-white' 
                : 'bg-muted text-gray-500'
              }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-quickbite-purple h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
