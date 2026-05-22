import "server-only";
import { getAllSites, getConfig, getAllShortcuts, parseCategoryOrder } from "@/lib/db";
import type { SiteData, ShortcutConfig } from "@/lib/types";
import type { SiteConfig } from "@/lib/db";

export function getSites(): { sites: SiteData[]; categories: string[]; config: SiteConfig; shortcuts: ShortcutConfig[] } {
  const rows = getAllSites();
  const config = getConfig();

  const sites: SiteData[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    desc: r.desc,
    icon: r.icon,
    icon_url: r.icon_url,
    category: r.category,
    url: { internal: r.url_internal, external: r.url_external },
    sort_order: r.sort_order,
    created_at: r.created_at,
  }));

  const configuredOrder = parseCategoryOrder(config.category_order);
  const configuredIndex = new Map(configuredOrder.map((category, index) => [category, index]));
  const categories = Array.from(new Set(sites.map((s) => s.category))).sort((a, b) => {
    const ai = configuredIndex.get(a);
    const bi = configuredIndex.get(b);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.localeCompare(b, "zh-CN");
  });

  const categoryIndex = new Map(categories.map((category, index) => [category, index]));
  sites.sort((a, b) => {
    const ci = (categoryIndex.get(a.category) ?? 0) - (categoryIndex.get(b.category) ?? 0);
    if (ci !== 0) return ci;
    const si = a.sort_order - b.sort_order;
    if (si !== 0) return si;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  const shortcuts = getAllShortcuts().map((s) => ({ key: s.key, site_id: s.site_id }));

  return { sites, categories, config, shortcuts };
}
