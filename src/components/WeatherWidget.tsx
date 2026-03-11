import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudDrizzle, Loader2, Droplets, Wind, CloudSun } from "lucide-react";

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

export function WeatherWidget() {
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
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=7`
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
        })),
      };
    },
    staleTime: 30 * 60 * 1000,
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

  if (!weather || !weather.forecast) return null;

  const CurrentIcon = weatherIcon(weather.currentCode);

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {weather.city}
          </p>
          <div className="flex items-end gap-1 mt-1">
            <span className="text-4xl font-mono font-bold leading-none">{weather.currentTemp}°</span>
          </div>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {weatherLabel(weather.currentCode)}
          </p>
        </div>
        <CurrentIcon className="w-10 h-10 text-primary mt-1" />
      </div>

      <div className="flex gap-4 mb-4 text-muted-foreground">
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

      <div className="border-t pt-3">
        <div className="flex justify-between">
          {weather.forecast.map((d, i) => {
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
    </div>
  );
}
