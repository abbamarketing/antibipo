import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudDrizzle, Loader2, Droplets, Wind, CloudSun, ChevronDown, ChevronUp } from "lucide-react";

interface WeatherData {
  city: string;
  currentTemp: number;
  currentCode: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: {
    day: string;
    code: number;
    tempMax: number;
    tempMin: number;
    precipProb: number;
  }[];
}

function weatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return Cloud;
  if (code <= 55) return CloudDrizzle;
  if (code <= 65) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  if (code <= 99) return CloudLightning;
  return Cloud;
}

function isRainy(code: number): boolean {
  return code >= 51; // drizzle, rain, snow, thunderstorm
}

function weatherLabel(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code === 1) return "Predominantemente limpo";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if (code <= 48) return "Nevoeiro";
  if (code <= 55) return "Garoa";
  if (code <= 65) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas de chuva";
  if (code <= 99) return "Trovoada";
  return "Indefinido";
}

const dayNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt`
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.municipality || "Montes Claros";
  } catch {
    return "Montes Claros";
  }
}

interface WeatherWidgetProps {
  compact?: boolean;
}

export function WeatherWidget({ compact = false }: WeatherWidgetProps) {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("ab_weather_expanded");
    return saved !== null ? saved === "true" : true;
  });

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem("ab_weather_expanded", String(next));
  };

  const { data: weather, isLoading } = useQuery<WeatherData>({
    queryKey: ["weather"],
    queryFn: async () => {
      let lat = -16.735;
      let lon = -43.8617;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // fallback to Montes Claros
      }

      const [weatherRes, city] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Sao_Paulo&forecast_days=7`
        ),
        reverseGeocode(lat, lon),
      ]);

      const data = await weatherRes.json();

      if (!data?.current || !data?.daily?.time) {
        throw new Error("Invalid weather data");
      }

      return {
        city,
        currentTemp: Math.round(data.current.temperature_2m),
        currentCode: data.current.weather_code,
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        precipitation: data.current.precipitation,
        forecast: data.daily.time.map((date: string, i: number) => ({
          day: dayNames[new Date(date + "T12:00:00").getDay()],
          code: data.daily.weather_code[i],
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          precipProb: data.daily.precipitation_probability_max?.[i] ?? 0,
        })),
      };
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  if (compact) {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (!weather) return null;
    const CompactIcon = weatherIcon(weather.currentCode);
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-muted-foreground" title={`${weather.currentTemp}° · ${weatherLabel(weather.currentCode)}`}>
        <CompactIcon className="w-4 h-4" />
        <span className="font-mono text-[10px] font-medium">{weather.currentTemp}°</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-3">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="font-mono text-[10px]">clima...</span>
      </div>
    );
  }

  if (!weather || !weather.forecast) return null;

  const CurrentIcon = weatherIcon(weather.currentCode);
  const todayRain = isRainy(weather.currentCode);

  return (
    <div>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/20 active:scale-[0.99] transition-all duration-150 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <CurrentIcon className={`w-5 h-5 ${todayRain ? "text-blue-400" : "text-primary"}`} />
          <span className="font-mono text-sm font-bold">{weather.currentTemp}°</span>
          <span className="text-xs text-muted-foreground font-body">{weatherLabel(weather.currentCode)}</span>
          <span className="font-mono text-[10px] text-muted-foreground/60">· {weather.city}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/50" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/50" />}
      </button>

      {/* Expanded: 7-day forecast */}
      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          {/* Current details */}
          <div className="flex gap-4 mb-4 text-muted-foreground/70">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span className="font-mono text-[10px]">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span className="font-mono text-[10px]">{weather.windSpeed} km/h</span>
            </div>
            <span className="font-mono text-[10px]">Sensação {weather.feelsLike}°</span>
          </div>

          {/* 7-day forecast */}
          <div className="border-t border-border/40 pt-3">
            <div className="flex justify-between gap-1">
              {weather.forecast.map((d, i) => {
                const Icon = weatherIcon(d.code);
                const isToday = i === 0;
                const hasRain = isRainy(d.code) || d.precipProb >= 40;

                return (
                  <div
                    key={d.day + i}
                    className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-colors ${
                      isToday
                        ? hasRain
                          ? "bg-blue-500/10 text-foreground"
                          : "bg-primary/10 text-foreground"
                        : hasRain
                        ? "text-blue-400"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isToday ? "font-bold" : ""} ${
                      isToday ? (hasRain ? "text-blue-400" : "text-primary") : ""
                    }`}>
                      {isToday ? "hoje" : d.day}
                    </span>
                    <Icon className={`w-4 h-4 ${hasRain ? "text-blue-400" : isToday ? "text-primary" : ""}`} />
                    {hasRain && d.precipProb > 0 && (
                      <span className="font-mono text-[8px] text-blue-400 flex items-center gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />
                        {d.precipProb}%
                      </span>
                    )}
                    <div className="flex gap-0.5 font-mono text-[9px]">
                      <span className="font-medium">{d.tempMax}°</span>
                      <span className="text-muted-foreground/40">{d.tempMin}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}