import {Restaurant} from "@/components/RestaurantCard";

// Fallback restaurant photos if Google doesn't provide any
const DEFAULT_RESTAURANT_PHOTOS = [
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1579684947550-22e945225d9a?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1569058242567-93de6f36f8e1?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1559314809-0d155014e29e?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&w=800&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&w=800&q=80",
];

// Google Places API configuration
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Map user cuisine selections to keyword search terms for Google Places API
const CUISINE_MAPPING: Record<string, string[]> = {
  arabic: ["Arabic", "Lebanese", "Mediterranean"],
  indian: ["Indian", "Curry"],
  italian: ["Italian", "Pizza"],
  chinese: ["Chinese", "Asian"],
  japanese: ["Japanese", "Sushi"],
  mexican: ["Mexican", "Tacos"],
  thai: ["Thai", "Spicy"],
  american: ["American", "Burgers"],
  mediterranean: ["Mediterranean", "Grill"],
  surprise: [], // Will be handled separately
};

// All available cuisine options matching the UI
export const CUISINE_OPTIONS = [
  {id: "arabic", name: "Arabic", emoji: "🥙"},
  {id: "indian", name: "Indian", emoji: "🍛"},
  {id: "italian", name: "Italian", emoji: "🍝"},
  {id: "chinese", name: "Chinese", emoji: "🥡"},
  {id: "japanese", name: "Japanese", emoji: "🍣"},
  {id: "mexican", name: "Mexican", emoji: "🌮"},
  {id: "thai", name: "Thai", emoji: "🍲"},
  {id: "american", name: "American", emoji: "🍔"},
  {id: "mediterranean", name: "Mediterranean", emoji: "🥗"},
];

// Interface for Google Places API response
interface PlacesResponse {
  results: GooglePlace[];
  status: string;
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string; // address
  rating?: number;
  price_level?: number;
  photos?: {photo_reference: string}[];
  opening_hours?: {open_now?: boolean};
  geometry: {location: {lat: number; lng: number}};
  types: string[];
}

// Calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

// Get photo URL from Google Places or use fallback
function getPhotoUrl(place: GooglePlace): string {
  if (place.photos && place.photos.length > 0) {
    const photoRef = place.photos[0].photo_reference;
    if (photoRef) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`;
    }
  }
  // Return a random fallback photo if no photo reference is available
  return DEFAULT_RESTAURANT_PHOTOS[
    Math.floor(Math.random() * DEFAULT_RESTAURANT_PHOTOS.length)
  ];
}

// Map Google Place to our Restaurant interface
function mapGooglePlaceToRestaurant(
  place: GooglePlace,
  userLat: number,
  userLng: number
): Restaurant {
  const placeLat = place.geometry.location.lat;
  const placeLng = place.geometry.location.lng;
  const distanceInKm = getDistanceFromLatLonInKm(
    userLat,
    userLng,
    placeLat,
    placeLng
  );

  // Determine cuisines based on place types and name
  const cuisines = determineCuisinesFromPlace(place);

  // Ensure we have at least one cuisine
  if (cuisines.length === 0) {
    cuisines.push("Restaurant");
  }

  return {
    id:
      place.place_id ||
      `restaurant-${Math.random().toString(36).substring(2, 11)}`,
    name: place.name || "Unknown Restaurant",
    rating: place.rating || 0,
    priceLevel: place.price_level || 1,
    address: place.vicinity || "No address available",
    distance: formatDistance(distanceInKm),
    photo: getPhotoUrl(place),
    isOpen: place.opening_hours?.open_now ?? true,
    cuisines: cuisines,
  };
}

// Try to determine cuisines from place data
function determineCuisinesFromPlace(place: GooglePlace): string[] {
  // Start with a general "Restaurant" cuisine
  const cuisines: string[] = ["Restaurant"];

  // Try to find matching cuisines from our supported options
  let matchFound = false;

  // Check if place types contain any of our cuisine keywords
  CUISINE_OPTIONS.forEach((option) => {
    if (
      place.types.some(
        (type) =>
          type.toLowerCase().includes(option.id.toLowerCase()) ||
          option.id.toLowerCase().includes(type.toLowerCase())
      )
    ) {
      cuisines.push(option.name);
      matchFound = true;
    }
  });

  // If no match in types, check the name against our cuisine mapping
  if (!matchFound) {
    Object.entries(CUISINE_MAPPING).forEach(([key, values]) => {
      const cuisineOption = CUISINE_OPTIONS.find((option) => option.id === key);
      if (cuisineOption) {
        // Check if any keyword is in the restaurant name
        if (
          values.some((keyword) =>
            place.name.toLowerCase().includes(keyword.toLowerCase())
          )
        ) {
          cuisines.push(cuisineOption.name);
          matchFound = true;
        }
      }
    });
  }

  // If still no specific cuisine found, try to identify based on common place types
  if (!matchFound) {
    const placeTypeMapping: Record<string, string> = {
      cafe: "Cafe",
      pizza: "Italian",
      sushi: "Japanese",
      curry: "Indian",
      kebab: "Mediterranean",
      burger: "American",
      steak: "American",
      seafood: "Seafood",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
    };

    for (const [typeKey, cuisineName] of Object.entries(placeTypeMapping)) {
      if (
        place.types.some((type) => type.includes(typeKey)) ||
        place.name.toLowerCase().includes(typeKey)
      ) {
        cuisines.push(cuisineName);
        break;
      }
    }
  }

  return cuisines;
}

export const fetchRestaurants = async (
  cuisines: string[],
  location: {address: string; lat?: number; lng?: number},
  radius: number = 5000
): Promise<Restaurant[]> => {
  try {
    console.log(cuisines, location);
    // Ensure we have coordinates
    if (!location.lat || !location.lng) {
      throw new Error("Location coordinates are required");
    }

    let keyword = "";

    if (!cuisines.includes("surprise")) {
      const cuisineTerms = cuisines.flatMap(
        (cuisine) => CUISINE_MAPPING[cuisine] || []
      );
      keyword = cuisineTerms.join(" ");
    } else {
      const randomCuisine =
        CUISINE_OPTIONS[Math.floor(Math.random() * CUISINE_OPTIONS.length)].id;
      const cuisineTerms = CUISINE_MAPPING[randomCuisine];
      keyword = cuisineTerms.join(" ");
    }

    console.log("Keyword for Google Places API:", keyword);

    // keyword = "Indian";

    // Build the Google Places API URL
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
      location.lat
    },${location.lng}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}${
      keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""
    }`;

    // Use a proxy endpoint to avoid CORS issues
    const proxyUrl = `/api/places-proxy?url=${encodeURIComponent(
      googleApiUrl
    )}`;

    console.log(
      `Searching for restaurants within ${radius / 1000}km of user location`
    );

    try {
      // Make the API request through the proxy
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: PlacesResponse = await response.json();
      console.log("Google Places API response:", data);

      if (data.status !== "OK") {
        throw new Error(`Google Places API returned status: ${data.status}`);
      }

      console.log(
        `Found ${data.results.length} restaurants from Google Places API`
      );

      // Map Google Places results to our Restaurant interface
      const restaurants = data.results.map((place) =>
        mapGooglePlaceToRestaurant(place, location.lat!, location.lng!)
      );

      console.log(restaurants);

      // Return results (not shuffled since real data has relevance ranking)
      return restaurants;
    } catch (apiError) {
      console.error("Error fetching from Google Places API:", apiError);
      throw new Error(
        "Failed to fetch restaurants from Google Places API. Please try again."
      );
    }
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};
