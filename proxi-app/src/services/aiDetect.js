import api from "./api";

export const detectListingCategory = async (userInput) => {
  try {
    const res = await api.post("/api/ai/detect", { input: userInput });
    if (res.data.success) return res.data.result;
    return null;
  } catch (e) {
    console.log("AI detect error:", e.message);
    return null;
  }
};

export const getFormRoute = (suggestedForm) => {
  switch(suggestedForm) {
    case "vehicle": return "PostVehicle";
    case "electronics":
    case "fashion":
    case "home":
    case "general": return "PostListing";
    case "task_delivery":
    case "task_skilled":
    case "task_errand": return "PostTask";
    default: return null;
  }
};
