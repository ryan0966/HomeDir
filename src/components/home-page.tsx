"use client";

import { type CSSProperties, type ReactNode, useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { SiteData, ShortcutConfig } from "@/lib/types";
import { getIcon, getIconUrl } from "@/lib/icons";
import { SearchDialog } from "@/components/search-dialog";
import { ShortcutHints } from "@/components/shortcut-hints";
import { NetworkToggle } from "@/components/network-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudSun, LocateFixed, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import NumberFlow from "@number-flow/react";

function getGreeting(hour: number) {
  if (hour < 6) return "夜深了";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

function Clock({ weather }: { weather: ReactNode }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-xs text-muted-foreground">
      {now ? (
        <>
          <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
            <span>{getGreeting(now.getHours())} 👋</span>
            {weather}
          </div>
          <div className="flex items-center">
            <NumberFlow value={now.getHours()} format={{ minimumIntegerDigits: 2 }} />
            <span className="mx-px opacity-50">:</span>
            <NumberFlow value={now.getMinutes()} format={{ minimumIntegerDigits: 2 }} />
            <span className="mx-px opacity-50">:</span>
            <NumberFlow value={now.getSeconds()} format={{ minimumIntegerDigits: 2 }} />
          </div>
        </>
      ) : (
        <>
          <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/10" />
          <div className="mt-1 h-4 w-14 animate-pulse rounded bg-muted-foreground/10" />
        </>
      )}
    </div>
  );
}

type WeatherState =
  | { status: "loading" }
  | { status: "ready"; location: string; temperature: number; windSpeed: number; text: string }
  | { status: "error" };

const weatherText: Record<number, string> = {
  0: "晴",
  1: "少云",
  2: "多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "强毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "强阵雨",
  82: "暴雨",
  95: "雷雨",
  113: "晴",
  116: "多云间晴",
  119: "多云",
  122: "阴",
  143: "薄雾",
  176: "局部有雨",
  179: "局部有雪",
  182: "雨夹雪",
  185: "冻雨",
  200: "雷雨",
  227: "吹雪",
  230: "暴雪",
  248: "雾",
  260: "冻雾",
  263: "小毛毛雨",
  266: "毛毛雨",
  281: "冻毛毛雨",
  284: "强冻毛毛雨",
  293: "小雨",
  296: "小雨",
  299: "中雨",
  302: "中雨",
  305: "大雨",
  308: "大雨",
  311: "冻雨",
  314: "强冻雨",
  317: "雨夹雪",
  320: "小雪",
  323: "小雪",
  326: "小雪",
  329: "中雪",
  332: "中雪",
  335: "大雪",
  338: "大雪",
  350: "冰粒",
  353: "阵雨",
  356: "强阵雨",
  359: "暴雨",
  362: "雨夹雪",
  365: "强雨夹雪",
  368: "阵雪",
  371: "强阵雪",
  386: "雷阵雨",
  389: "雷雨",
  392: "雷阵雪",
  395: "强雷阵雪",
};

const locationNameMap: Record<string, string> = {
  "hong kong": "香港",
  hongkong: "香港",
  "hong kong sar china": "香港",
  macao: "澳门",
  macau: "澳门",
  taipei: "台北",
  beijing: "北京",
  shanghai: "上海",
  shenzhen: "深圳",
  guangzhou: "广州",
};

function normalizeLocationName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "当前位置";
  return locationNameMap[trimmed.toLowerCase()] ?? trimmed;
}

async function geocodeLocation(query: string): Promise<{ latitude: number; longitude: number; location: string } | null> {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query.trim());
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "zh");
    url.searchParams.set("format", "json");
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    const latitude = Number(first?.latitude);
    const longitude = Number(first?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const location = [first.name, first.admin1].filter(Boolean).slice(0, 2).join(" · ");
    return { latitude, longitude, location: normalizeLocationName(location || query) };
  } catch {
    return null;
  }
}

async function getIpLocation(): Promise<{ latitude: number; longitude: number; location: string } | null> {
  const endpoints = [
    "https://ipwho.is/?lang=zh-CN",
    "https://ipapi.co/json/",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const latitude = Number(data.latitude ?? data.lat);
      const longitude = Number(data.longitude ?? data.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      const location = [data.city, data.region, data.country_name ?? data.country]
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ");
      return { latitude, longitude, location: normalizeLocationName(location || "当前位置") };
    } catch {}
  }
  return null;
}

function getBrowserLocation(): Promise<{ latitude: number; longitude: number; location: string } | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location: "当前位置",
      }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 30 * 60 * 1000 }
    );
  });
}

type WeatherResult = { location: string; temperature: number; windSpeed: number; text: string };

async function fetchWttrWeather(
  location: { latitude: number; longitude: number; location: string } | null,
  query?: string
): Promise<WeatherResult | null> {
  try {
    const target = query?.trim() || (location ? `${location.latitude},${location.longitude}` : "");
    if (!target) return null;
    const url = new URL(`https://wttr.in/${encodeURIComponent(target)}`);
    url.searchParams.set("format", "j1");
    url.searchParams.set("lang", "zh");
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current_condition?.[0];
    if (!current) return null;
    const code = Number(current.weatherCode);
    const fallbackText = current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || "天气";
    const nearest = data.nearest_area?.[0];
    const nearestName = nearest?.areaName?.[0]?.value;
    const displayName = normalizeLocationName(query?.trim() || location?.location || nearestName || "当前位置");
    const temperature = Math.round(Number(current.temp_C));
    const windSpeed = Math.round(Number(current.windspeedKmph));
    if (!Number.isFinite(temperature) || !Number.isFinite(windSpeed)) return null;
    return {
      location: displayName,
      temperature,
      windSpeed,
      text: weatherText[code] ?? fallbackText,
    };
  } catch {
    return null;
  }
}

async function fetchOpenMeteoWeather(location: { latitude: number; longitude: number; location: string }): Promise<WeatherResult | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
    url.searchParams.set("timezone", "auto");
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    if (!current) return null;
    const temperature = Math.round(Number(current.temperature_2m));
    const windSpeed = Math.round(Number(current.wind_speed_10m));
    if (!Number.isFinite(temperature) || !Number.isFinite(windSpeed)) return null;
    return {
      location: location.location,
      temperature,
      windSpeed,
      text: weatherText[Number(current.weather_code)] ?? "天气",
    };
  } catch {
    return null;
  }
}

function WeatherBadge({ enabled, locationQuery }: { enabled: boolean; locationQuery: string }) {
  const [weather, setWeather] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      setWeather({ status: "loading" });
      const configuredLocation = locationQuery.trim();
      const location = configuredLocation
        ? await geocodeLocation(configuredLocation)
        : (await getBrowserLocation()) ?? (await getIpLocation());

      const weather = await fetchWttrWeather(location, configuredLocation)
        ?? (location ? await fetchOpenMeteoWeather(location) : null);

      if (!weather) {
        if (!cancelled) setWeather({ status: "error" });
        return;
      }

      if (!cancelled) {
        setWeather({
          status: "ready",
          location: weather.location,
          temperature: weather.temperature,
          windSpeed: weather.windSpeed,
          text: weather.text,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [enabled, locationQuery]);

  if (!enabled) return null;

  if (weather.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-[11px] text-muted-foreground/70">
        <CloudSun className="size-3.5 animate-pulse" />
        <span>天气加载中</span>
      </span>
    );
  }

  if (weather.status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] text-muted-foreground/55">
        <CloudSun className="size-3.5" />
        <span>天气暂不可用</span>
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-[17rem] items-center gap-1.5 truncate rounded-md border border-border/70 bg-muted/35 px-1.5 py-0.5 text-[11px] text-muted-foreground/80">
      <LocateFixed className="size-3 shrink-0 text-primary" />
      <span className="truncate">{weather.location}</span>
      <span className="shrink-0 text-foreground/80">{weather.temperature}°C</span>
      <span className="shrink-0">{weather.text}</span>
      <span className="shrink-0 text-muted-foreground/45">风 {weather.windSpeed}km/h</span>
    </span>
  );
}

const ALL = "all";

function CategoryTabs({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const updateIndicator = useCallback(() => {
    const indicator = indicatorRef.current;
    const activeTab = tabRefs.current.get(active);
    if (!indicator || !activeTab) return;

    indicator.style.width = `${activeTab.offsetWidth}px`;
    indicator.style.height = `${activeTab.offsetHeight}px`;
    indicator.style.left = `${activeTab.offsetLeft}px`;
    indicator.style.top = `${activeTab.offsetTop}px`;
  }, [active]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) updateIndicator();
  }, [mounted, updateIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const tabs = [ALL, ...categories];

  return (
    <div className="mb-6 flex justify-center">
      <nav
        className="relative inline-flex flex-wrap gap-1 rounded-2xl border bg-muted/40 p-1"
      >
        {/* 滑动指示器：挂载后才显示 */}
        {mounted && (
          <div
            ref={indicatorRef}
            className="pointer-events-none absolute rounded-lg bg-foreground transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          />
        )}

        {tabs.map((cat) => (
          <button
            key={cat}
            ref={(el) => {
              if (el) tabRefs.current.set(cat, el);
            }}
            className={`relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              active === cat
                ? mounted
                  ? "text-background"
                  : "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
            onClick={() => onSelect(cat)}
          >
            {cat === ALL ? "全部" : cat}
          </button>
        ))}
      </nav>
    </div>
  );
}

async function probeInternal(url: string, timeout = 2000): Promise<boolean> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    // 快速失败（< 300ms）通常是 CORS/mixed-content，说明主机可达
    // 超时失败说明主机不可达
    return Date.now() - start < timeout - 200;
  }
}

async function detectNetwork(internalUrls: string[]): Promise<boolean> {
  if (internalUrls.length === 0) return false;
  // 取前 3 个内网地址并发探测，任一可达即为内网
  const targets = internalUrls.slice(0, 3);
  const results = await Promise.all(targets.map((url) => probeInternal(url)));
  return results.some(Boolean);
}

export function HomePage({
  sites,
  categories,
  shortcuts,
  autoDetectNetwork,
  defaultCategory,
  homeColumns,
  weatherEnabled,
  weatherLocation,
}: {
  sites: SiteData[];
  categories: string[];
  shortcuts: ShortcutConfig[];
  autoDetectNetwork: boolean;
  defaultCategory: string;
  homeColumns: number;
  weatherEnabled: boolean;
  weatherLocation: string;
}) {
  const [active, setActive] = useState(defaultCategory);
  const [isInternal, setIsInternal] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 自动探测开启时检测内外网，手动切换后跳过
  useEffect(() => {
    if (!autoDetectNetwork || manualOverride) return;
    const urls = [...new Set(sites.map((s) => s.url.internal))].filter(Boolean);
    detectNetwork(urls).then(setIsInternal);
  }, [sites, manualOverride, autoDetectNetwork]);

  const handleToggle = useCallback((val: boolean) => {
    setManualOverride(true);
    setIsInternal(val);
  }, []);

  const filtered = useMemo(
    () => (active === ALL ? sites : sites.filter((s) => s.category === active)),
    [sites, active]
  );
  const preferredColumns = Math.min(8, Math.max(1, Math.trunc(homeColumns || 3)));
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(160px, calc((100% - ${(preferredColumns - 1) * 12}px) / ${preferredColumns}))), 1fr))`,
  } satisfies CSSProperties;

  return (
    <>
      <SearchDialog sites={sites} categories={categories} isInternal={isInternal} open={searchOpen} onOpenChange={setSearchOpen} />
      <ShortcutHints sites={sites} isInternal={isInternal} onSearch={() => setSearchOpen(true)} shortcuts={shortcuts} />

      {/* 工具栏 */}
      <div className="mb-8 flex items-center justify-between">
        <Clock weather={<WeatherBadge enabled={weatherEnabled} locationQuery={weatherLocation} />} />
        <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-3.5" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <NetworkToggle isInternal={isInternal} onToggle={handleToggle} />
          <div className="mx-0.5 h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>

      {/* 分类标签栏 */}
      <CategoryTabs
        categories={categories}
        active={active}
        onSelect={setActive}
      />

      {/* 站点网格 */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed py-24">
          <span className="text-sm text-muted-foreground">
            暂无站点 ·{" "}
            <Link href="/dash" className="underline underline-offset-4 hover:text-foreground">
              去后台添加
            </Link>
          </span>
        </div>
      ) : (
        <div className="grid gap-3" style={gridStyle}>
          {filtered.map((site) => {
            const Icon = getIcon(site.icon);
            const url = (isInternal ? site.url.internal : site.url.external) || site.url.internal || site.url.external;
            return (
              <a
                key={site.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-foreground/15 hover:bg-accent/50 hover:shadow-md sm:gap-3.5 sm:p-4"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors sm:size-10 sm:rounded-xl">
                  {site.icon_url ? (
                    <img src={getIconUrl(site.icon_url)} alt="" className="size-5 rounded-md object-contain sm:size-6" />
                  ) : (
                    <Icon className="size-3.5 sm:size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="truncate text-xs font-medium sm:text-sm">{site.name}</span>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{site.desc}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
