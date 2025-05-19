
import React from 'react';
import { Star, Navigation, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  priceLevel?: number;
  address: string;
  distance?: string;
  photo?: string;
  isOpen?: boolean;
  cuisines: string[];
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onTryAnother: () => void;
  isLoading?: boolean;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant, 
  onTryAnother,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="restaurant-card animate-pulse p-6 max-w-md mx-auto">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
        <div className="h-10 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="restaurant-card max-w-md mx-auto animate-fade-in">
      <div
        className="h-48 bg-gray-100 bg-center bg-cover"
        style={{
          backgroundImage: `url(${restaurant.photo})`,
        }}
      ></div>

      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>

        <div className="flex items-center mb-4">
          <div className="flex items-center mr-4">
            <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
            <span>{restaurant.rating.toFixed(1)}</span>
          </div>

          {restaurant.distance && (
            <div className="flex items-center mr-4">
              <Navigation className="h-4 w-4 text-quickbite-purple-dark mr-1" />
              <span>{restaurant.distance}</span>
            </div>
          )}

          {restaurant.isOpen !== undefined && (
            <div
              className={`flex items-center ${
                restaurant.isOpen ? "text-green-600" : "text-red-500"
              }`}
            >
              <Clock className="h-4 w-4 mr-1" />
              <span>{restaurant.isOpen ? "Open" : "Closed"}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-4">{restaurant.address}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {restaurant.cuisines.map((cuisine, index) => (
            <span
              key={index}
              className="text-sm px-3 py-1 rounded-full bg-quickbite-purple-soft text-quickbite-purple-dark"
            >
              {cuisine}
            </span>
          ))}
        </div>

        <Button
          className="w-full flex items-center justify-center btn-primary"
          onClick={onTryAnother}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Another
        </Button>
      </div>
    </div>
  );
};

export default RestaurantCard;
