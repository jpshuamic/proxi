export const CROSS_SELL_RULES = {
  real_estate: {
    title: "People renting also need",
    services: [
      { icon: "truck-outline", label: "Moving trucks", searchQuery: "moving truck", color: "#378ADD" },
      { icon: "brush-outline", label: "Painters", searchQuery: "painter", color: "#FF6B9D" },
      { icon: "flash-outline", label: "Electricians", searchQuery: "electrician", color: "#FFD700" },
      { icon: "water-outline", label: "Plumbers", searchQuery: "plumber", color: "#1DB954" },
      { icon: "sparkles-outline", label: "Cleaners", searchQuery: "cleaner", color: "#9B59B6" },
      { icon: "construct-outline", label: "Carpenters", searchQuery: "carpenter", color: "#FF6B35" },
    ]
  },
  vehicles: {
    title: "Vehicle owners also need",
    services: [
      { icon: "car-outline", label: "Car wash", searchQuery: "car wash", color: "#378ADD" },
      { icon: "construct-outline", label: "Mechanic", searchQuery: "mechanic", color: "#FF6B35" },
      { icon: "camera-outline", label: "Car photographer", searchQuery: "photographer", color: "#FFD700" },
      { icon: "shield-outline", label: "Panel beater", searchQuery: "panel beater", color: "#1DB954" },
    ]
  },
  electronics: {
    title: "Buyers also look for",
    services: [
      { icon: "construct-outline", label: "Phone repair", searchQuery: "phone repair", color: "#378ADD" },
      { icon: "shield-outline", label: "Screen protector", searchQuery: "screen protector", color: "#1DB954" },
      { icon: "power-outline", label: "Chargers", searchQuery: "charger", color: "#FFD700" },
    ]
  },
  home_furniture: {
    title: "Setting up your home?",
    services: [
      { icon: "brush-outline", label: "Painters", searchQuery: "painter", color: "#FF6B9D" },
      { icon: "flash-outline", label: "Electricians", searchQuery: "electrician", color: "#FFD700" },
      { icon: "construct-outline", label: "Carpenters", searchQuery: "carpenter", color: "#FF6B35" },
      { icon: "sparkles-outline", label: "Cleaners", searchQuery: "cleaner", color: "#9B59B6" },
    ]
  },
  fashion: {
    title: "Style lovers also need",
    services: [
      { icon: "shirt-outline", label: "Tailors", searchQuery: "tailor", color: "#FF6B9D" },
      { icon: "color-palette-outline", label: "Laundry", searchQuery: "laundry", color: "#378ADD" },
    ]
  },
  repair_services: {
    title: "Related services",
    services: [
      { icon: "flash-outline", label: "Electricians", searchQuery: "electrician", color: "#FFD700" },
      { icon: "water-outline", label: "Plumbers", searchQuery: "plumber", color: "#1DB954" },
      { icon: "construct-outline", label: "Carpenters", searchQuery: "carpenter", color: "#FF6B35" },
    ]
  },
};

export const getCrossSell = (category) => {
  return CROSS_SELL_RULES[category] || null;
};

export const TASK_CROSS_SELL = {
  delivery: {
    title: "Also popular for deliveries",
    items: ["Packaging materials", "Extra riders", "Warehouse storage"],
  },
  moving: {
    title: "Moving? You also need",
    items: ["Painters", "Cleaners", "Electricians", "Plumbers"],
  },
};
