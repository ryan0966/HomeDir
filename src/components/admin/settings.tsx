"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateConfigAction, uploadLogoAction } from "@/app/dash/actions";
import { GithubIcon } from "@/components/icons/github";
import { getIconUrl } from "@/lib/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CloudSun, Columns3, Image, Loader2, Save, Upload, X } from "lucide-react";

export function AdminSettings({
  config,
  categories,
}: {
  config: {
    site_name: string;
    site_description: string;
    footer_text: string;
    auto_detect_network: string;
    site_logo: string;
    theme_color: string;
    default_category: string;
    home_columns: string;
    weather_enabled: string;
    weather_location: string;
    github_url: string;
  };
  categories: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    site_name: config.site_name,
    site_description: config.site_description,
    footer_text: config.footer_text,
    auto_detect_network: config.auto_detect_network,
    site_logo: config.site_logo,
    theme_color: config.theme_color,
    default_category: config.default_category,
    home_columns: config.home_columns,
    weather_enabled: config.weather_enabled,
    weather_location: config.weather_location,
    github_url: config.github_url,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(async () => {
    if (!form.site_name.trim()) { toast.error("站点名称不能为空"); return; }
    if (!form.site_description.trim()) { toast.error("站点描述不能为空"); return; }
    setSaving(true);
    try {
      const { auto_detect_network: _, ...basicConfig } = form;
      const result = await updateConfigAction(basicConfig);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("配置已保存");
      router.refresh();
    } finally { setSaving(false); }
  }, [form, router]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 text-sm font-medium">基本设置</div>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_name">站点名称</Label>
            <Input
              id="cfg_name"
              value={form.site_name}
              onChange={(e) => setForm((p) => ({ ...p, site_name: e.target.value }))}
              required
            />
            <p className="text-[11px] text-muted-foreground">页面标题</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_desc">站点描述</Label>
            <Input
              id="cfg_desc"
              value={form.site_description}
              onChange={(e) => setForm((p) => ({ ...p, site_description: e.target.value }))}
              required
            />
            <p className="text-[11px] text-muted-foreground">SEO描述</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_footer">页脚文字</Label>
            <Input
              id="cfg_footer"
              value={form.footer_text}
              onChange={(e) => setForm((p) => ({ ...p, footer_text: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">支持 HTML，留空则不显示</p>
          </div>
          <div className="grid gap-1.5">
            <Label>网站 Logo</Label>
            <div className="flex items-center gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                {form.site_logo ? (
                  <img src={getIconUrl(form.site_logo)} alt="" className="size-7 rounded object-contain" />
                ) : (
                  <Image className="size-4 text-muted-foreground" />
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingLogo(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const result = await uploadLogoAction(fd);
                    if (!result.success) {
                      toast.error(result.error);
                      return;
                    }
                    setForm((p) => ({ ...p, site_logo: result.data! }));
                    toast.success("Logo 已选择，保存后生效");
                  } finally {
                    setUploadingLogo(false);
                    e.target.value = "";
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                {uploadingLogo ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                上传
              </Button>
              {form.site_logo && (
                <Button variant="ghost" size="sm" onClick={() => setForm((p) => ({ ...p, site_logo: "" }))}>
                  <X className="size-3.5" />
                  移除
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">显示在首页标题左侧</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_theme_color">主题色</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cfg_theme_color"
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(form.theme_color) ? form.theme_color : "#22c55e"}
                onChange={(e) => setForm((p) => ({ ...p, theme_color: e.target.value }))}
                className="h-9 w-14 shrink-0 p-1"
              />
              <Input
                value={form.theme_color}
                onChange={(e) => setForm((p) => ({ ...p, theme_color: e.target.value }))}
                placeholder="#22c55e"
                className="font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">用于首页和后台的主色调</p>
          </div>
          <div className="grid gap-1.5">
            <Label>首页默认分类</Label>
            <div className="flex flex-wrap gap-2">
              {["all", ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, default_category: category }))}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    form.default_category === category
                      ? "border-foreground/20 bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {category === "all" ? "全部" : category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_home_columns" className="flex items-center gap-1.5">
              <Columns3 className="size-3.5" />
              首页每行站点数
            </Label>
            <Input
              id="cfg_home_columns"
              type="number"
              min={1}
              max={8}
              value={form.home_columns}
              onChange={(e) => setForm((p) => ({ ...p, home_columns: e.target.value }))}
              className="h-8 w-24 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">作为大屏期望列数，小屏会自动减少，优先保证卡片完整显示</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_github_url" className="flex items-center gap-1.5">
              <GithubIcon className="size-3.5" />
              GitHub 链接
            </Label>
            <Input
              id="cfg_github_url"
              value={form.github_url}
              onChange={(e) => setForm((p) => ({ ...p, github_url: e.target.value }))}
              placeholder="https://github.com/ryan0966/HomeDir"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            保存配置
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 text-sm font-medium">功能配置</div>
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label>自动探测网络</Label>
              <p className="text-[11px] text-muted-foreground">自动检测内外网并切换访问地址</p>
            </div>
            <Switch
              checked={form.auto_detect_network === "true"}
              onCheckedChange={async (v) => {
                const val = v ? "true" : "false";
                setForm((p) => ({ ...p, auto_detect_network: val }));
                const result = await updateConfigAction({ auto_detect_network: val });
                if (result.success) toast.success(v ? "已开启自动探测" : "已关闭自动探测");
                else toast.error(result.error);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label className="flex items-center gap-1.5">
                <CloudSun className="size-3.5" />
                首页天气
              </Label>
              <p className="text-[11px] text-muted-foreground">可指定地区；留空时根据浏览器定位或 IP 位置显示</p>
            </div>
            <Switch
              checked={form.weather_enabled === "true"}
              onCheckedChange={(v) => setForm((p) => ({ ...p, weather_enabled: v ? "true" : "false" }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cfg_weather_location">天气地区</Label>
            <Input
              id="cfg_weather_location"
              value={form.weather_location}
              onChange={(e) => setForm((p) => ({ ...p, weather_location: e.target.value }))}
              placeholder="例如：深圳、香港、上海浦东"
              className="h-8 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">填写后优先显示该地区天气，可避免 VPN/IP 定位偏差</p>
          </div>
        </div>
      </div>
    </div>
  );
}
