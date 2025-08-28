export interface LocationData {
  country: string;
  region: string;
}

export const getLocationFromIP = async (ip: string): Promise<LocationData> => {
  try {
    const response = await fetch(`https://ipwho.is/${ip}`);
    const data: any = await response.json();

    if (!data.success) {
      console.error("IP lookup failed:", data.message);
      return { country: "Unknown Country", region: "Unknown Region" };
    }

    return {
      country: data.country || "Unknown Country",
      region: data.region || "Unknown Region",
    };
  } catch (err) {
    console.error("Failed to fetch location:", err);
    return { country: "Unknown Country", region: "Unknown Region" };
  }
};
