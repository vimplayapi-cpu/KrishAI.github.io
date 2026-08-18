// Verified Indian crop reference names used across the platform (crop select, advisor, disease scanning).
export const CROPS = [
  "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Groundnut", "Mustard",
  "Sunflower", "Chickpea", "Pigeon pea", "Black gram", "Green gram", "Lentil", "Pea",
  "Jute", "Tea", "Coffee", "Rubber", "Coconut", "Banana", "Mango", "Papaya", "Guava",
  "Grapes", "Pomegranate", "Tomato", "Potato", "Onion", "Garlic", "Chilli", "Turmeric",
  "Ginger", "Cabbage", "Cauliflower", "Brinjal", "Okra", "Spinach", "Fenugreek", "Coriander",
] as const;
export type CropName = (typeof CROPS)[number];
