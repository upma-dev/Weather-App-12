"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search, LogOut, Wind, Droplets, Eye, Thermometer, MapPin,
  Plus, X, RefreshCw, Sun, Cloud, CloudRain, Snowflake, Zap,
  Gauge, Sunrise, Sunset, Activity, Star
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { greetingFromHour, hourAtLocation } from "@/lib/greeting";

interface WeatherData {
  current: any;
  forecast: any[];
  airQuality: any;
}

interface User {
  name: string;
  email: string;
  savedCities: string[];
}

const AQI_LABELS = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
const AQI_COLORS = ["", "#00d4aa", "#6366f1", "#ffd700", "#ff6b35", "#ef4444"];

function getWeatherEmoji(condition: string, icon: string) {
  const isDay = icon?.endsWith("d");
  const c = condition?.toLowerCase();
  if (c?.includes("thunder")) return "⛈";
  if (c?.includes("drizzle")) return "🌦";
  if (c?.includes("rain")) return "🌧";
  if (c?.includes("snow")) return "🌨";
  if (c?.includes("mist") || c?.includes("fog") || c?.includes("haze")) return "🌫";
  if (c?.includes("clear")) return isDay ? "☀️" : "🌙";
  if (c?.includes("few clouds")) return isDay ? "🌤" : "🌥";
  if (c?.includes("scattered")) return "⛅";
  if (c?.includes("cloud")) return "☁️";
  return "🌡";
}

function getBg(condition: string) {
  const c = condition?.toLowerCase();
  if (c?.includes("thunder")) return "from-slate-900 to-purple-950";
  if (c?.includes("rain") || c?.includes("drizzle")) return "from-slate-800 to-blue-950";
  if (c?.includes("snow")) return "from-blue-900 to-slate-800";
  if (c?.includes("clear")) return "from-indigo-900 to-sky-950";
  return "from-indigo-950 to-slate-900";
}

const QUICK_CITIES = ["New York", "London", "Tokyo", "Dubai", "Paris", "Sydney", "Mumbai", "Singapore"];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState("London");
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "forecast" | "details">("overview");

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      setUser(data.user);
      if (data.user.savedCities?.length > 0) setSelectedCity(data.user.savedCities[0]);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchWeather = useCallback(async (city: string, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWeather(data);
    } catch (err: any) {
      toast.error(err.message || "City not found");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setSelectedCity(searchCity.trim());
    setSearchCity("");
  };

  const addCity = async (city: string) => {
    if (!user || user.savedCities.includes(city)) return;
    const updated = [...user.savedCities, city];
    setUser({ ...user, savedCities: updated });
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedCities: updated }),
    });
    toast.success(`${city} added!`);
  };

  const removeCity = async (city: string) => {
    if (!user) return;
    const updated = user.savedCities.filter((c) => c !== city);
    setUser({ ...user, savedCities: updated });
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedCities: updated }),
    });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="animated-bg min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-6xl animate-float">🌤</div>
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Fetching weather data...</p>
      </div>
    );
  }

  const w = weather?.current;
  const condition = w?.weather?.[0]?.description || "clear sky";
  const icon = w?.weather?.[0]?.icon || "01d";
  const emoji = getWeatherEmoji(condition, icon);
  const bgClass = getBg(condition);

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";

  const tz = weather?.current?.timezone;
  const locationGreeting =
    typeof tz === "number"
      ? greetingFromHour(hourAtLocation(currentTime.getTime(), tz))
      : greetingFromHour(currentTime.getHours());

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} animated-bg relative`}>
      {/* Decorative orbs */}
      <div className="orb w-96 h-96 bg-indigo-600/15 -top-32 -right-32" />
      <div className="orb w-80 h-80 bg-teal-500/10 bottom-0 left-0" />

      {/* Top navbar */}
      <nav className="sticky top-0 z-50 px-4 py-4"
        style={{ background: "rgba(8,8,24,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <span className="text-2xl shrink-0">🌤</span>
            <div className="hidden sm:block min-w-0">
              <p className="font-display font-bold text-white text-lg leading-none">WeatherApp</p>
              {user && firstName && (
                <p className="text-xs mt-1 font-semibold truncate" style={{ color: "rgba(165, 243, 252, 0.95)" }}>
                  {locationGreeting}, {firstName}
                  {w?.name ? (
                    <span className="font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {" "}· {w.name} local time
                    </span>
                  ) : null}
                </p>
              )}
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {format(currentTime, "EEEE, dd MMM yyyy • HH:mm:ss")}
              </p>
            </div>
            <div className="sm:hidden min-w-0 flex-1">
              <p className="font-display font-bold text-white text-base leading-tight truncate">WeatherApp</p>
              {user && firstName && (
                <p className="text-[11px] mt-0.5 font-semibold truncate" style={{ color: "rgba(165, 243, 252, 0.95)" }}>
                  {locationGreeting}, {firstName}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="w-full min-w-0 sm:flex-1 sm:max-w-md">
            <div className="input-with-icons input-with-icons--compact">
              <span className="input-with-icons__leading">
                <Search className="w-4 h-4 shrink-0 opacity-50" aria-hidden />
              </span>
              <input
                type="search"
                enterKeyHint="search"
                className="input-with-icons__field pr-3"
                placeholder="Search city…"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                aria-label="Search city"
              />
            </div>
          </form>

          <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/[0.06] sm:border-0">
            <button onClick={() => fetchWeather(selectedCity, true)} disabled={refreshing}
              className="p-2.5 rounded-xl glass card-hover" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl glass">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #00d4aa)" }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-white/80 font-medium max-w-[120px] truncate">{user?.name}</span>
            </div>
            <button onClick={logout} className="p-2.5 rounded-xl glass card-hover text-white/60 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Saved cities */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Star className="inline w-3 h-3 mr-1 mb-0.5" />
                Saved Cities
              </h3>
              <div className="space-y-2">
                {user?.savedCities.map((city) => (
                  <div key={city} onClick={() => setSelectedCity(city)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedCity === city
                        ? "text-white"
                        : "hover:bg-white/5 text-white/60 hover:text-white"
                    }`}
                    style={selectedCity === city ? { background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(0,212,170,0.15))", border: "1px solid rgba(99,102,241,0.3)" } : {}}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" style={{ color: selectedCity === city ? "#6366f1" : "inherit" }} />
                      <span className="text-sm font-medium">{city}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeCity(city); }}
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-400 transition-colors p-1 -m-1"
                      style={{ opacity: selectedCity === city ? 0.85 : undefined }}
                      aria-label={`Remove ${city}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick add cities */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Plus className="inline w-3 h-3 mr-1 mb-0.5" />
                Quick Add
              </h3>
              <div className="flex flex-wrap gap-2">
                {QUICK_CITIES.filter((c) => !user?.savedCities.includes(c)).map((city) => (
                  <button key={city} onClick={() => addCity(city)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all hover:text-white font-medium"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    + {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">

            {/* Hero weather card */}
            {w && (
              <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(0,212,170,0.08))", border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute text-[120px] sm:text-[200px] font-bold right-2 sm:right-4 -top-4 sm:-top-8 select-none">{emoji}</div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3 min-w-0">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-semibold text-white/70 truncate">{w.name}, {w.sys?.country}</span>
                    </div>
                    <div className="flex items-end gap-2 sm:gap-4 mb-2 sm:mb-3">
                      <span className="text-5xl sm:text-8xl weather-icon shrink-0 leading-none">{emoji}</span>
                      <div className="min-w-0">
                        <div className="font-display text-5xl sm:text-7xl font-bold text-white leading-none tabular-nums">
                          {Math.round(w.main?.temp)}°
                        </div>
                        <div className="text-white/50 text-xs sm:text-sm mt-1">Feels like {Math.round(w.main?.feels_like)}°C</div>
                      </div>
                    </div>
                    <p className="capitalize text-base sm:text-lg font-semibold text-white/80">{condition}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-white/50">
                      <span>↑ {Math.round(w.main?.temp_max)}°</span>
                      <span>↓ {Math.round(w.main?.temp_min)}°</span>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full sm:w-auto sm:min-w-[220px] shrink-0">
                    {[
                      { icon: <Droplets className="w-4 h-4" />, label: "Humidity", value: `${w.main?.humidity}%`, color: "#6366f1" },
                      { icon: <Wind className="w-4 h-4" />, label: "Wind", value: `${Math.round(w.wind?.speed * 3.6)} km/h`, color: "#00d4aa" },
                      { icon: <Eye className="w-4 h-4" />, label: "Visibility", value: `${(w.visibility / 1000).toFixed(1)} km`, color: "#a8d8ea" },
                      { icon: <Gauge className="w-4 h-4" />, label: "Pressure", value: `${w.main?.pressure} hPa`, color: "#ff6b35" },
                    ].map((stat) => (
                      <div key={stat.label} className="glass rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 mb-1" style={{ color: stat.color }}>
                          {stat.icon}
                          <span className="text-xs font-medium text-white/50">{stat.label}</span>
                        </div>
                        <p className="text-base font-bold text-white font-mono">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {(["overview", "forecast", "details"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                    activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                  style={activeTab === tab ? {
                    background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(0,212,170,0.15))",
                    border: "1px solid rgba(99,102,241,0.3)"
                  } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && weather && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sunrise/Sunset */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Sun Timeline</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌅</div>
                      <p className="text-xs text-white/40 mb-1">Sunrise</p>
                      <p className="font-mono font-bold text-white text-lg">
                        {format(new Date(weather.current.sys?.sunrise * 1000), "HH:mm")}
                      </p>
                    </div>
                    <div className="flex-1 mx-2 sm:mx-4 min-w-0">
                      <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #ff6b35, #ffd700)",
                            width: `${Math.min(100, Math.max(0,
                              ((currentTime.getTime() / 1000 - weather.current.sys.sunrise) /
                                (weather.current.sys.sunset - weather.current.sys.sunrise)) * 100
                            ))}%`
                          }} />
                        <div className="absolute w-3 h-3 rounded-full -top-0.75 -translate-y-[25%] transform"
                          style={{
                            background: "#ffd700",
                            boxShadow: "0 0 8px #ffd700",
                            left: `${Math.min(96, Math.max(0,
                              ((currentTime.getTime() / 1000 - weather.current.sys.sunrise) /
                                (weather.current.sys.sunset - weather.current.sys.sunrise)) * 100
                            ))}%`
                          }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌇</div>
                      <p className="text-xs text-white/40 mb-1">Sunset</p>
                      <p className="font-mono font-bold text-white text-lg">
                        {format(new Date(weather.current.sys?.sunset * 1000), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Air Quality */}
                {weather.airQuality && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Air Quality Index</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-mono text-white"
                        style={{ background: `${AQI_COLORS[weather.airQuality.main?.aqi]}22`, border: `2px solid ${AQI_COLORS[weather.airQuality.main?.aqi]}` }}>
                        {weather.airQuality.main?.aqi}
                      </div>
                      <div>
                        <p className="text-xl font-bold" style={{ color: AQI_COLORS[weather.airQuality.main?.aqi] }}>
                          {AQI_LABELS[weather.airQuality.main?.aqi]}
                        </p>
                        <p className="text-xs text-white/40 mt-1">PM2.5: {weather.airQuality.components?.pm2_5?.toFixed(1)} μg/m³</p>
                        <p className="text-xs text-white/40">CO: {weather.airQuality.components?.co?.toFixed(0)} μg/m³</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Today's summary */}
                <div className="glass rounded-2xl p-5 sm:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Activity className="inline w-3 h-3 mr-1 mb-0.5" />
                    Today at a Glance
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Cloud Cover", value: `${w?.clouds?.all}%`, icon: "☁️" },
                      { label: "UV Index", value: "Moderate", icon: "☀️" },
                      { label: "Dew Point", value: `${Math.round((w?.main?.temp - ((100 - w?.main?.humidity) / 5)))}°C`, icon: "💧" },
                      { label: "Wind Dir", value: `${w?.wind?.deg}°`, icon: "🧭" },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="text-sm font-bold text-white">{item.value}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "forecast" && weather && (
              <div className="space-y-3">
                <p className="text-sm text-white/40">5-Day Forecast for <span className="text-white font-medium">{selectedCity}</span></p>
                {weather.forecast.map((day: any, i: number) => {
                  const date = parseISO(day.dt_txt);
                  const dayEmoji = getWeatherEmoji(day.weather[0].description, day.weather[0].icon);
                  return (
                    <div key={i} className="glass rounded-2xl p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between card-hover">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="shrink-0 w-[72px] sm:w-20">
                          <p className="font-semibold text-white text-sm">{i === 0 ? "Today" : format(date, "EEE")}</p>
                          <p className="text-xs text-white/40">{format(date, "MMM dd")}</p>
                        </div>
                        <span className="text-2xl sm:text-3xl shrink-0">{dayEmoji}</span>
                        <p className="capitalize text-xs sm:text-sm text-white/60 flex-1 min-w-0 truncate sm:text-center">
                          {day.weather[0].description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 border-t border-white/[0.06] pt-2 sm:border-0 sm:pt-0">
                        <div className="flex items-center gap-1 text-sm">
                          <Droplets className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-white/50">{day.main.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-white font-bold">{Math.round(day.main.temp_max)}°</span>
                          <span className="text-white/40">{Math.round(day.main.temp_min)}°</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "details" && w && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Temperature", value: `${Math.round(w.main?.temp)}°C`, sub: `Feels ${Math.round(w.main?.feels_like)}°C`, icon: "🌡", color: "#ff6b35" },
                  { label: "Humidity", value: `${w.main?.humidity}%`, sub: "Relative humidity", icon: "💧", color: "#6366f1" },
                  { label: "Wind Speed", value: `${Math.round(w.wind?.speed * 3.6)} km/h`, sub: `Direction: ${w.wind?.deg}°`, icon: "💨", color: "#00d4aa" },
                  { label: "Pressure", value: `${w.main?.pressure} hPa`, sub: "Atmospheric", icon: "🔘", color: "#a8d8ea" },
                  { label: "Visibility", value: `${(w.visibility / 1000).toFixed(1)} km`, sub: "Clear visibility", icon: "👁", color: "#ffd700" },
                  { label: "Cloud Cover", value: `${w.clouds?.all}%`, sub: "Sky coverage", icon: "☁️", color: "#94a3b8" },
                  { label: "Min Temp", value: `${Math.round(w.main?.temp_min)}°C`, sub: "Daily minimum", icon: "❄️", color: "#a8d8ea" },
                  { label: "Max Temp", value: `${Math.round(w.main?.temp_max)}°C`, sub: "Daily maximum", icon: "🔥", color: "#ff6b35" },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-2xl p-5 card-hover">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {item.label}
                        </p>
                        <p className="font-display text-2xl sm:text-3xl font-bold text-white">{item.value}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{item.sub}</p>
                      </div>
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <div className="mt-3 h-1 rounded-full" style={{ background: `${item.color}22` }}>
                      <div className="h-full rounded-full w-2/3" style={{ background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
