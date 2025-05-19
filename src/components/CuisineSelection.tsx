import React from "react";
import {CUISINE_OPTIONS} from "@/services/restaurantService";

interface CuisineSelectionProps {
  selectedCuisines: string[];
  onSelectionChange: (cuisines: string[]) => void;
}

const CuisineSelection: React.FC<CuisineSelectionProps> = ({
  selectedCuisines,
  onSelectionChange,
}) => {
  const toggleCuisine = (cuisineId: string) => {
    if (selectedCuisines.includes(cuisineId)) {
      onSelectionChange(selectedCuisines.filter((id) => id !== cuisineId));
    } else {
      onSelectionChange([...selectedCuisines, cuisineId]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {CUISINE_OPTIONS.map((cuisine) => (
        <div
          key={cuisine.id}
          className={`cuisine-card ${
            selectedCuisines.includes(cuisine.id) ? "selected" : ""
          }`}
          onClick={() => toggleCuisine(cuisine.id)}
        >
          <span className="text-4xl mb-2">{cuisine.emoji}</span>
          <span className="font-medium">{cuisine.name}</span>
        </div>
      ))}
    </div>
  );
};

export default CuisineSelection;
