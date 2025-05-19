import React, {useState, useEffect} from "react";
import {MapPin, Loader} from "lucide-react";
import {useToast} from "@/hooks/use-toast";

interface LocationInputProps {
  onBack: () => void;
  onComplete: (location: {address: string; lat?: number; lng?: number}) => void;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

const LocationInput: React.FC<LocationInputProps> = ({onBack, onComplete}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const {toast} = useToast();
  const [distance, setDistance] = useState(5); // Default 5km radius

  // Fetch place predictions when user types
  useEffect(() => {
    const fetchPredictions = async () => {
      // Don't search if input is empty or too short
      if (!searchValue || searchValue.length < 3) {
        setPredictions([]);
        return;
      }

      // Don't search if user is typing "Current Location"
      if (
        searchValue.toLowerCase() === "current" ||
        searchValue.toLowerCase() === "current " ||
        searchValue.toLowerCase() === "current l"
      ) {
        setPredictions([
          {description: "Current Location", place_id: "current_location"},
        ]);
        return;
      }

      try {
        setIsLoadingPredictions(true);

        // Call the Places Autocomplete API
        const endpoint = `/api/places-proxy?url=${encodeURIComponent(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            searchValue
          )}&types=geocode&key=${import.meta.env.VITE_GOOGLE_API_KEY || ""}`
        )}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Autocomplete error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "OK" && data.predictions) {
          // Always ensure Current Location is an option
          const autocompletePredictions = data.predictions.map(
            (prediction: {description: string; place_id: string}) => ({
              description: prediction.description,
              place_id: prediction.place_id,
            })
          );

          // Add Current Location to the top if it matches the search
          if ("current location".includes(searchValue.toLowerCase())) {
            setPredictions([
              {description: "Current Location", place_id: "current_location"},
              ...autocompletePredictions,
            ]);
          } else {
            setPredictions(autocompletePredictions);
          }
        } else {
          console.warn("Autocomplete API returned status:", data.status);
          // If API fails, still show Current Location option
          setPredictions([
            {description: "Current Location", place_id: "current_location"},
          ]);
        }
      } catch (error) {
        console.error("Error fetching predictions:", error);
        // If API fails, still show Current Location option
        setPredictions([
          {description: "Current Location", place_id: "current_location"},
        ]);
      } finally {
        setIsLoadingPredictions(false);
      }
    };

    // Use debounce to prevent too many API calls
    const timeoutId = setTimeout(fetchPredictions, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  // Geocode the address to get coordinates
  const geocodeAddress = async (
    address: string
  ): Promise<{lat: number; lng: number} | null> => {
    try {
      // Use Google's Geocoding API to get real coordinates
      const endpoint = `/api/places-proxy?url=${encodeURIComponent(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${import.meta.env.VITE_GOOGLE_API_KEY || ""}`
      )}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        console.error("Geocoding API error:", data.status);
        return null;
      }

      const location = data.results[0].geometry.location;
      return {lat: location.lat, lng: location.lng};
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  };

  // Get details for a place_id
  const getPlaceDetails = async (
    placeId: string
  ): Promise<{lat: number; lng: number; address: string} | null> => {
    try {
      const endpoint = `/api/places-proxy?url=${encodeURIComponent(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${
          import.meta.env.VITE_GOOGLE_API_KEY || ""
        }`
      )}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Place details error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.result) {
        console.error("Place Details API error:", data.status);
        return null;
      }

      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
        address: data.result.formatted_address,
      };
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const handleLocationSelect = async (prediction: PlacePrediction) => {
    setSearchValue(prediction.description);
    setPredictions([]);
    setLocationError(null);

    try {
      let coords;
      const address = prediction.description;

      if (prediction.place_id === "current_location") {
        // Get current location using browser geolocation
        coords = await getCurrentLocation();
        if (coords) {
          onComplete({
            address: "Your Current Location",
            lat: coords.lat,
            lng: coords.lng,
          });
        } else {
          throw new Error("Could not get your current location");
        }
      } else {
        // Get place details using place_id
        const details = await getPlaceDetails(prediction.place_id);

        if (details) {
          onComplete({
            address: details.address || prediction.description,
            lat: details.lat,
            lng: details.lng,
          });
        } else {
          // Fallback to geocoding if place details fails
          coords = await geocodeAddress(prediction.description);
          if (coords) {
            onComplete({
              address: prediction.description,
              lat: coords.lat,
              lng: coords.lng,
            });
          } else {
            throw new Error("Could not find coordinates for this location");
          }
        }
      }
    } catch (error) {
      setLocationError("Error getting location coordinates");
      toast({
        title: "Location Error",
        description: "Could not determine coordinates for this location",
        variant: "destructive",
      });
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setIsLoadingLocation(false);
      setLocationError("Geolocation is not supported by your browser");
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    try {
      const coords = await getCurrentLocation();

      if (!coords) {
        throw new Error("Could not get your location");
      }

      console.log("Location found:", coords);

      // In a real app, we would use reverse geocoding to get the actual address
      const location = {
        address: "Your Current Location",
        lat: coords.lat,
        lng: coords.lng,
      };

      console.log("Location found:", location);

      setIsLoadingLocation(false);
      toast({
        title: "Location found!",
        description:
          "Using your current location to find restaurants within 5km",
      });
      onComplete(location);
    } catch (error) {
      setIsLoadingLocation(false);
      console.error("Error getting location:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Could not get your location";

      setLocationError(errorMessage);
      toast({
        title: "Location error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Function to get user's current location using the browser's geolocation API
  const getCurrentLocation = () => {
    return new Promise<{lat: number; lng: number} | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleManualLocationSubmit = async () => {
    if (!searchValue.trim()) {
      setLocationError("Please enter a location or use current location");
      toast({
        title: "Location required",
        description: "Please enter a location or use your current location",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingLocation(true);

      // Try to geocode the entered location
      const coords = await geocodeAddress(searchValue);

      if (!coords) {
        throw new Error("Could not find coordinates for this location");
      }

      setIsLoadingLocation(false);

      onComplete({
        address: searchValue,
        lat: coords.lat,
        lng: coords.lng,
      });
    } catch (error) {
      setIsLoadingLocation(false);
      setLocationError(
        "Could not find this location. Please try another search term."
      );
      toast({
        title: "Location not found",
        description: "Could not find coordinates for this location",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="location" className="block font-medium">
          Enter your location
        </label>
        <div className="relative">
          <input
            id="location"
            type="text"
            className="w-full px-4 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-quickbite-purple focus:border-transparent"
            placeholder="Search for a location..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {isLoadingPredictions && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="h-4 w-4 text-quickbite-purple animate-spin" />
            </div>
          )}
        </div>

        {predictions.length > 0 && (
          <ul className="mt-1 bg-white border border-muted rounded-lg overflow-hidden shadow-md max-h-60 overflow-y-auto z-10">
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                className="px-4 py-2 hover:bg-quickbite-purple-soft cursor-pointer"
                onClick={() => handleLocationSelect(prediction)}
              >
                {prediction.description}
              </li>
            ))}
          </ul>
        )}

        {locationError && (
          <p className="text-red-500 text-sm mt-1">{locationError}</p>
        )}
      </div>
      <div className="space-y-2 mt-4">
  <label htmlFor="distance" className="block font-medium">
    Search radius
  </label>
  <div className="flex items-center gap-3">
    <input
      id="distance"
      type="range"
      min="1"
      max="12"
      step="0.2"
      value={distance}
      onChange={(e) => setDistance(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-quickbite-purple"
    />
    <span className="min-w-[60px] text-center font-medium">{distance} km</span>
  </div>
  <p className="text-sm text-gray-500">
    Show restaurants up to {distance} kilometers away
  </p>
</div>


      <div className="flex items-center justify-center">
        <div className="relative w-full md:w-1/2">
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="border-t border-gray-300 w-full"></span>
          </span>
          <span className="relative flex justify-center">
            <span className="bg-white px-4 text-sm text-gray-500">or</span>
          </span>
        </div>
      </div>

      <button
        className="w-full flex items-center justify-center bg-white border border-muted rounded-lg p-3 hover:bg-gray-50 transition-colors"
        onClick={handleGetCurrentLocation}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <>
            <Loader className="mr-2 h-5 w-5 text-quickbite-purple animate-spin" />
            <span>Getting your location...</span>
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-5 w-5 text-quickbite-purple" />
            <span>Use my current location</span>
          </>
        )}
      </button>

      <div className="flex justify-between mt-8">
        <button
          className="px-6 py-2 border border-muted rounded-lg hover:bg-gray-50 transition-colors"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="px-6 py-2 bg-quickbite-purple text-white rounded-lg hover:bg-quickbite-purple-dark transition-colors"
          onClick={handleManualLocationSubmit}
          disabled={isLoadingLocation}
        >
          Find Restaurants
        </button>
      </div>
    </div>
  );
};

export default LocationInput;
