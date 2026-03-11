import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudDrizzle, Loader2 } from "lucide-react";

interface DayForecast {
  day: string;
  code: number;
  tempMax: number;
  tempMin: number;
}

// WMO Weather interpretation codes → icon
function weatherIcon(code: number) {
  if (code <= 1) return Sun; // clear
  if (code <= 3) return Cloud; // cloudy
  if (code <= 48) return Cloud; // fog
  if (code <= 55) return CloudDrizzle; // drizzle
  if (code <= 65) return CloudRain; // rain
  if (code <= 77) return CloudSnow; // snow
  if (code <= 82) return CloudRain; // showers
  if (code <= 99) return CloudLightning; // thunderstorm
  return Cloud;
}

const dayNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function WeatherWidget() {
  const { data: forecast, isLoading } = useQuery<DayForecast[]>({
    queryKey: ["weather"],
    queryFn: async () => {
      // Montes Claros, MG coordinates (fallback)
      let lat = -16.735;
      let lon = -43.8617;

      // Try geolocation
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {}

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=7`
      );
      const data = await res.json();
      return data.daily.time.map((date: string, i: number) => ({
        day: dayNames[new Date(date + "T12:00:00").getDay()],
        code: data.daily.weather_code[i],
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
      }));
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="font-mono text-[10px]">clima...</span>
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <div className="bg-card rounded-lg border p-3">
      <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-2">
        CLIMA
      </h3>
      <div className="flex justify-between">
        {forecast.map((d, i) => {
          const Icon = weatherIcon(d.code);
          const isToday = i === 0;
          return (
            <div
              key={d.day + i}
              className={`flex flex-col items-center gap-0.5 ${isToday ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span className={`font-mono text-[9px] uppercase tracking-wider ${isToday ? "font-bold text-primary" : ""}`}>
                {isToday ? "hoje" : d.day}
              </span>
              <Icon className={`w-4 h-4 ${isToday ? "text-primary" : ""}`} />
              <div className="flex gap-0.5 font-mono text-[9px]">
                <span className="font-medium">{d.tempMax}°</span>
                <span className="text-muted-foreground/60">{d.tempMin}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
