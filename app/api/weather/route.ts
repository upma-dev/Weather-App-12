import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "London";
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&cnt=40`),
    ]);

    if (!currentRes.ok) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const [current, forecast] = await Promise.all([currentRes.json(), forecastRes.json()]);

    // Process 5-day forecast (one per day)
    const dailyMap = new Map();
    forecast.list.forEach((item: any) => {
      const date = item.dt_txt.split(" ")[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, item);
      }
    });
    const dailyForecast = Array.from(dailyMap.values()).slice(0, 5);

    // Air quality (optional - uses coordinates from current)
    let airQuality = null;
    try {
      const aqRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${current.coord.lat}&lon=${current.coord.lon}&appid=${API_KEY}`
      );
      if (aqRes.ok) {
        const aqData = await aqRes.json();
        airQuality = aqData.list[0];
      }
    } catch {}

    return NextResponse.json({ current, forecast: dailyForecast, airQuality }, { status: 200 });
  } catch (error) {
    console.error("Weather error:", error);
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
