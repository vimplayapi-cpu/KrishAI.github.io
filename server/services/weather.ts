/**
 * Weather intelligence module.
 * Provider abstraction with failover: primary = Open-Meteo (free, no key,
 * global coverage, real observational + forecast data). Results carry
 * provider, timestamps and freshness so the UI can label LIVE / CACHED / STALE.
 */
import { getCachedWeather, setCachedWeather } from "../db";

export interface WeatherDaily {
  date: string;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  rainfall: number;
  windSpeed: number;
  humidity: number;
}

export interface WeatherResult {
  freshness: "LIVE" | "CACHED" | "STALE";
  provider: string;
  retrievedAt: string;
  location: { state: string; district: string; village?: string; lat: number; lon: number };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
    description: string;
    isDay: boolean;
  };
  hourly: { time: string; temperature: number; rainProbability: number }[];
  daily: WeatherDaily[];
  agri: {
    sprayingSuitability: "good" | "caution" | "unsuitable";
    rainRisk: "low" | "moderate" | "high";
    irrigationAdvice: string;
    heatStress: boolean;
    humidityDiseaseRisk: "low" | "moderate" | "high";
  };
  retrievedFrom: "api" | "cache";
  cacheAgeMinutes?: number;
}

const WMO: Record<number, { description: string }> = {
  0: { description: "Clear sky" },
  1: { description: "Mainly clear" },
  2: { description: "Partly cloudy" },
  3: { description: "Overcast" },
  45: { description: "Foggy" },
  48: { description: "Rime fog" },
  51: { description: "Light drizzle" },
  53: { description: "Moderate drizzle" },
  55: { description: "Dense drizzle" },
  61: { description: "Slight rain" },
  63: { description: "Moderate rain" },
  65: { description: "Heavy rain" },
  71: { description: "Slight snow" },
  73: { description: "Moderate snow" },
  75: { description: "Heavy snow" },
  77: { description: "Snow grains" },
  80: { description: "Slight rain showers" },
  81: { description: "Moderate rain showers" },
  82: { description: "Violent rain showers" },
  95: { description: "Thunderstorm" },
  96: { description: "Thunderstorm with slight hail" },
  99: { description: "Thunderstorm with heavy hail" },
};

async function fetchOpenMeteo(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    hourly: "temperature_2m,precipitation_probability",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max",
    timezone: "Asia/Kolkata",
    forecast_days: "7",
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = (await res.json()) as any;
  return data;
}

function mapCode(code: number): { description: string } {
  return WMO[code] ?? { description: "Unknown conditions" };
}

function deriveAgri(current: WeatherResult["current"], daily: WeatherDaily[]) {
  const rainToday = daily[0]?.rainProbability ?? 0;
  const humidity = current.humidity;
  const temp = current.temperature;
  const wind = current.windSpeed;

  let sprayingSuitability: WeatherResult["agri"]["sprayingSuitability"] = "good";
  if (rainToday > 40 || wind > 20 || temp > 38 || humidity > 90) sprayingSuitability = "unsuitable";
  else if (rainToday > 15 || wind > 12 || temp > 34) sprayingSuitability = "caution";

  const rainRisk: "low" | "moderate" | "high" = rainToday > 60 ? "high" : rainToday > 30 ? "moderate" : "low";

  let irrigationAdvice = "No irrigation needed today — recent or expected rainfall likely sufficient.";
  if (rainToday < 15 && temp > 32) irrigationAdvice = "High evaporation expected — irrigate early morning or evening if soil is dry.";
  else if (rainToday < 15) irrigationAdvice = "Light irrigation may be needed; check soil moisture at root depth before watering.";

  const heatStress = temp > 38;
  const humidityDiseaseRisk: "low" | "moderate" | "high" = humidity > 85 ? "high" : humidity > 70 ? "moderate" : "low";

  return { sprayingSuitability, rainRisk, irrigationAdvice, heatStress, humidityDiseaseRisk };
}

export async function getWeather(opts: {
  lat: number;
  lon: number;
  state: string;
  district: string;
  village?: string;
  forceLive?: boolean;
}): Promise<WeatherResult> {
  const locationKey = `${opts.lat.toFixed(3)},${opts.lon.toFixed(3)}`;

  if (!opts.forceLive) {
    const cached = await getCachedWeather(locationKey, 60);
    if (cached && !cached.stale && cached.data) {
      const r = cached.data as WeatherResult;
      return { ...r, freshness: "CACHED", retrievedFrom: "cache" };
    }
    if (cached && cached.stale && cached.data) {
      // stale cache: return it but label as STALE, still try live refresh below
      try {
        return await fetchAndCache(locationKey, opts);
      } catch {
        const r = cached.data as WeatherResult;
        return { ...r, freshness: "STALE", retrievedFrom: "cache", cacheAgeMinutes: Math.round((Date.now() - cached.fetchedAt.getTime()) / 60000) };
      }
    }
  }

  try {
    return await fetchAndCache(locationKey, opts);
  } catch (err) {
    throw new Error("Weather data currently unavailable from provider. Please try again shortly.");
  }
}

async function fetchAndCache(locationKey: string, opts: { lat: number; lon: number; state: string; district: string; village?: string }): Promise<WeatherResult> {
  const data = await fetchOpenMeteo(opts.lat, opts.lon);

  const nowIdx = data.current?.time ? new Date(data.current.time).getTime() : Date.now();
  const hourly = (data.hourly?.time ?? []).slice(0, 24).map((t: string, i: number) => ({
    time: t,
    temperature: data.hourly.temperature_2m?.[i],
    rainProbability: data.hourly.precipitation_probability?.[i] ?? 0,
  }));

  const daily: WeatherDaily[] = (data.daily?.time ?? []).map((t: string, i: number) => ({
    date: t,
    tempMax: data.daily.temperature_2m_max?.[i],
    tempMin: data.daily.temperature_2m_min?.[i],
    rainProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
    rainfall: data.daily.precipitation_sum?.[i] ?? 0,
    windSpeed: data.daily.wind_speed_10m_max?.[i],
    humidity: data.daily.relative_humidity_2m_max?.[i],
  }));

  const current: WeatherResult["current"] = {
    temperature: data.current?.temperature_2m,
    humidity: data.current?.relative_humidity_2m,
    windSpeed: data.current?.wind_speed_10m,
    rainProbability: data.hourly?.precipitation_probability?.[0] ?? 0,
    description: mapCode(data.current?.weather_code ?? -1).description,
    isDay: data.current?.is_day === 1,
  };

  const result: WeatherResult = {
    freshness: "LIVE",
    provider: "Open-Meteo",
    retrievedAt: new Date().toISOString(),
    location: { state: opts.state, district: opts.district, village: opts.village, lat: opts.lat, lon: opts.lon },
    current,
    hourly,
    daily,
    agri: deriveAgri(current, daily),
    retrievedFrom: "api",
  };

  await setCachedWeather(locationKey, result, "Open-Meteo");
  return result;
}

/** India state -> approximate coordinates fallback for weather lookups. */
export const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  "Andhra Pradesh": { lat: 15.9129, lon: 79.74 },
  Assam: { lat: 26.1445, lon: 91.7362 },
  Bihar: { lat: 25.6093, lon: 85.1237 },
  Chhattisgarh: { lat: 21.2787, lon: 81.8661 },
  Gujarat: { lat: 22.2587, lon: 71.1924 },
  Haryana: { lat: 29.0588, lon: 76.0856 },
  Jharkhand: { lat: 23.6102, lon: 85.2799 },
  Karnataka: { lat: 15.3173, lon: 75.7139 },
  Kerala: { lat: 10.8505, lon: 76.2711 },
  "Madhya Pradesh": { lat: 22.9734, lon: 78.6569 },
  Maharashtra: { lat: 19.7515, lon: 75.7139 },
  Odisha: { lat: 20.9517, lon: 85.0985 },
  Punjab: { lat: 31.1471, lon: 75.3412 },
  Rajasthan: { lat: 27.0238, lon: 74.2179 },
  "Tamil Nadu": { lat: 11.1271, lon: 78.6569 },
  Telangana: { lat: 18.1124, lon: 79.0193 },
  "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
  Uttarakhand: { lat: 30.0668, lon: 79.0193 },
  "West Bengal": { lat: 22.9868, lon: 87.855 },
};

export function getSeason(now = new Date()): "kharif" | "rabi" | "zaid" {
  const m = now.getMonth(); // 0-indexed
  if (m >= 5 && m <= 10) return "kharif";
  if (m >= 11 || m <= 2) return "rabi";
  return "zaid";
}
