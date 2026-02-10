"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@submitin/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@submitin/ui/components/select";
import { Badge } from "@submitin/ui/components/badge";
import { Palette, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@submitin/ui/lib/utils";
import {
  type CustomTheme,
  defaultTheme,
  themePresets,
  generateThemeStyles,
} from "@/lib/theme-utils";

interface ThemeEditorProps {
  theme: CustomTheme | null;
  onChange: (theme: CustomTheme | null) => void;
  isPro?: boolean;
  disabled?: boolean;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ColorInput({ label, value, onChange, disabled }: ColorInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "w-10 h-10 rounded-lg border border-border cursor-pointer",
              "appearance-none bg-transparent",
              "[&::-webkit-color-swatch-wrapper]:p-1",
              "[&::-webkit-color-swatch]:rounded-md",
              "[&::-webkit-color-swatch]:border-0",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="#000000"
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function ThemePreview({ theme }: { theme: CustomTheme }) {
  const t = useTranslations("formBuilder");
  const styles = generateThemeStyles(theme);

  return (
    <div
      className="rounded-lg border p-4 space-y-3 transition-colors"
      style={{
        ...styles,
        backgroundColor: theme.backgroundColor || defaultTheme.backgroundColor,
        borderColor: `${theme.primaryColor || defaultTheme.primaryColor}33`,
      }}
    >
      <div
        className="rounded-md p-3 space-y-2"
        style={{
          backgroundColor: theme.cardBackground || defaultTheme.cardBackground,
        }}
      >
        <h4
          className="font-semibold text-sm"
          style={{ color: theme.textColor || defaultTheme.textColor }}
        >
          {t("previewFormTitle")}
        </h4>
        <p
          className="text-xs opacity-70"
          style={{ color: theme.textColor || defaultTheme.textColor }}
        >
          {t("previewFormSubtitle")}
        </p>
        <div className="flex gap-2 pt-2">
          <div
            className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
            style={{
              backgroundColor: theme.primaryColor || defaultTheme.primaryColor,
              borderRadius: theme.borderRadius === "full" ? "9999px" : undefined,
            }}
          >
            {t("previewButton")}
          </div>
          <div
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{
              backgroundColor: `${theme.accentColor || defaultTheme.accentColor}22`,
              color: theme.accentColor || defaultTheme.accentColor,
            }}
          >
            {t("previewAccent")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeEditor({
  theme,
  onChange,
  isPro = true,
  disabled = false,
}: ThemeEditorProps) {
  const t = useTranslations("formBuilder");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Usa o tema atual ou o padrão para edição
  const currentTheme: CustomTheme = theme || defaultTheme;

  const handleColorChange = (key: keyof CustomTheme, value: string) => {
    if (disabled || !isPro) return;

    const newTheme: CustomTheme = {
      ...currentTheme,
      [key]: value,
    };
    onChange(newTheme);
    setSelectedPreset(null);
  };

  const handlePresetSelect = (presetName: string) => {
    if (disabled || !isPro) return;

    const preset = themePresets[presetName];
    if (preset) {
      onChange(preset);
      setSelectedPreset(presetName);
    }
  };

  const handleReset = () => {
    if (disabled) return;
    onChange(null);
    setSelectedPreset(null);
  };

  const handleBorderRadiusChange = (value: string) => {
    if (disabled || !isPro) return;

    const newTheme: CustomTheme = {
      ...currentTheme,
      borderRadius: value as CustomTheme["borderRadius"],
    };
    onChange(newTheme);
    setSelectedPreset(null);
  };

  // Componente bloqueado para usuários não-Pro
  if (!isPro) {
    return (
      <Card className="opacity-70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {t("customThemeTitle")}
            <Badge variant="secondary" className="ml-2">
              PRO
            </Badge>
          </CardTitle>
          <CardDescription>
            {t("customThemeDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">{t("customThemeProFeature")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("customThemeProUpgradeDesc")}
              </p>
            </div>
            <Button variant="default" className="mt-4" asChild>
              <Link href="/dashboard/billing">{t("customThemeUpgrade")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t("customThemeTitle")}
            </CardTitle>
            <CardDescription>
              {t("customThemeDesc")}
            </CardDescription>
          </div>
          {theme && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("resetTheme")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets */}
        <div className="space-y-3">
          <Label>{t("themePresets")}</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(themePresets).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => handlePresetSelect(name)}
                disabled={disabled}
                className={cn(
                  "group relative h-12 rounded-lg border-2 transition-all overflow-hidden",
                  selectedPreset === name
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                title={name.charAt(0).toUpperCase() + name.slice(1)}
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: preset.backgroundColor }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-2"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <div
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: preset.accentColor }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Cores customizadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorInput
            label={t("primaryColor")}
            value={currentTheme.primaryColor || defaultTheme.primaryColor!}
            onChange={(v) => handleColorChange("primaryColor", v)}
            disabled={disabled}
          />
          <ColorInput
            label={t("accentColor")}
            value={currentTheme.accentColor || defaultTheme.accentColor!}
            onChange={(v) => handleColorChange("accentColor", v)}
            disabled={disabled}
          />
          <ColorInput
            label={t("backgroundColor")}
            value={currentTheme.backgroundColor || defaultTheme.backgroundColor!}
            onChange={(v) => handleColorChange("backgroundColor", v)}
            disabled={disabled}
          />
          <ColorInput
            label={t("cardBackground")}
            value={currentTheme.cardBackground || defaultTheme.cardBackground!}
            onChange={(v) => handleColorChange("cardBackground", v)}
            disabled={disabled}
          />
          <ColorInput
            label={t("textColor")}
            value={currentTheme.textColor || defaultTheme.textColor!}
            onChange={(v) => handleColorChange("textColor", v)}
            disabled={disabled}
          />
          <div className="space-y-2">
            <Label className="text-sm">{t("borderRadius")}</Label>
            <Select
              value={currentTheme.borderRadius || "lg"}
              onValueChange={handleBorderRadiusChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("borderRadiusNone")}</SelectItem>
                <SelectItem value="sm">{t("borderRadiusSm")}</SelectItem>
                <SelectItem value="md">{t("borderRadiusMd")}</SelectItem>
                <SelectItem value="lg">{t("borderRadiusLg")}</SelectItem>
                <SelectItem value="xl">{t("borderRadiusXl")}</SelectItem>
                <SelectItem value="full">{t("borderRadiusFull")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>{t("preview")}</Label>
          <ThemePreview theme={currentTheme} />
        </div>
      </CardContent>
    </Card>
  );
}
