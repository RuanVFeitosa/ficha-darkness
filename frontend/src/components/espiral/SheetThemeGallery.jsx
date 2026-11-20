import React, { useState } from "react";
import {
  UNIVERSE_THEMES,
  PRIDE_FLAGS,
  sheetTheme,
  applySheetTheme,
} from "../../data/sheetThemes";
import DarknessColorPicker from "../ui/DarknessColorPicker";
import "../../styles/SheetThemes.css";

export function PrideFlag({ flag, customColors, className = "" }) {
  const colors =
    flag.id === "custom" && customColors?.length ? customColors : flag.colors;
  const weights = colors.map((_, index) => flag.weights?.[index] || 1),
    total = weights.reduce((sum, value) => sum + value, 0);
  let y = 0;
  return (
    <svg
      className={`pd-pride-flag ${className}`}
      viewBox="0 0 300 180"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Bandeira ${flag.name}`}
    >
      {colors.map((color, index) => {
        const height = (weights[index] / total) * 180;
        const rect = (
          <rect
            key={index}
            x="0"
            y={y}
            width="300"
            height={height + 0.2}
            fill={color}
          />
        );
        y += height;
        return rect;
      })}
      {flag.triangle && (
        <polygon points="0,0 125,90 0,180" fill={flag.triangle} />
      )}
      {flag.chevron &&
        ["#ffffff", "#f5a9b8", "#5bcefa", "#784f17", "#000000"].map(
          (color, index) => (
            <polygon
              key={color}
              points={`0,${-75 + index * 18} ${165 - index * 20},90 0,${255 - index * 18}`}
              fill={color}
            />
          ),
        )}
      {flag.ring && (
        <circle
          cx="150"
          cy="90"
          r="43"
          fill="none"
          stroke={flag.ring}
          strokeWidth="12"
        />
      )}
    </svg>
  );
}

export function PortraitThemeBackdrop({ theme, customColors }) {
  if (theme.image)
    return (
      <div
        className="pd-portrait-theme-backdrop is-judgment"
        aria-hidden="true"
      >
        <img src={theme.image} alt="" />
      </div>
    );
  if (theme.flag)
    return (
      <div className="pd-portrait-theme-backdrop is-pride" aria-hidden="true">
        <PrideFlag flag={theme.flag} customColors={customColors} />
      </div>
    );
  return null;
}

export default function SheetThemeGallery({ sheet, setSheet }) {
  const active = sheetTheme(sheet.themePreset);
  const [category, setCategory] = useState(active.flag ? "pride" : "universe"),
    [stripe, setStripe] = useState(0),
    [query, setQuery] = useState("");
  const colors = sheet.customPrideFlag?.length
    ? sheet.customPrideFlag
    : PRIDE_FLAGS.find((item) => item.id === "custom").colors;
  const stripeIndex = Math.min(stripe, colors.length - 1);
  function apply(id) {
    setSheet((previous) => applySheetTheme(previous, id));
  }
  function editColors(next) {
    setSheet((previous) => {
      const updated={...previous,customPrideFlag:next};
      return previous.themePreset==='pride-custom'?applySheetTheme(updated,'pride-custom'):updated;
    });
  }
  return (
    <section className="pd-theme-gallery" aria-label="Temas prontos">
      <header>
        <div>
          <span className="es-eyebrow">TEMAS PRONTOS</span>
          <h3>Escolha a identidade da ficha.</h3>
        </div>
        <small>Atual: {active.name}</small>
      </header>
      <div
        className="pd-theme-categories"
        role="group"
        aria-label="Categorias de temas"
      >
        <button
          type="button"
          aria-pressed={category === "universe"}
          onClick={() => setCategory("universe")}
        >
          Universo Darkness
        </button>
        <button
          type="button"
          aria-pressed={category === "pride"}
          onClick={() => setCategory("pride")}
        >
          Orgulho LGBTQI+
        </button>
      </div>
      {category === "universe" ? (
        <div className="pd-universe-themes">
          {UNIVERSE_THEMES.map((theme) => (
            <button
              type="button"
              key={theme.id}
              className="pd-ready-theme"
              aria-label={`Aplicar tema ${theme.name}`}
              aria-pressed={active.id === theme.id}
              onClick={() => apply(theme.id)}
              style={{
                "--theme-accent": theme.palette.primaria,
                "--theme-surface": theme.palette.secundaria,
              }}
            >
              <span
                className={`pd-theme-art ${theme.image ? "is-cover" : ""}`}
                aria-hidden="true"
              >
                <img src={theme.image || theme.symbolSrc} alt="" />
              </span>
              <strong>{theme.name}</strong>
              <small>{theme.description}</small>
              <span className="pd-theme-swatches" aria-hidden="true">
                {["fundo", "secundaria", "primaria", "texto"].map((key) => (
                  <i key={key} style={{ background: theme.palette[key] }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <label className="pd-theme-search">
            Buscar identidade ou orientação
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Trans, não binário, bi…"
            />
          </label>
          <div className="pd-pride-themes">
            {PRIDE_FLAGS.filter((flag) =>
              flag.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .includes(
                  query
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase(),
                ),
            ).map((flag) => (
              <button
                type="button"
                key={flag.id}
                aria-label={`Aplicar tema ${flag.name}`}
                aria-pressed={active.id === `pride-${flag.id}`}
                onClick={() => apply(`pride-${flag.id}`)}
              >
                <PrideFlag flag={flag} customColors={colors} />
                <span>{flag.name}</span>
              </button>
            ))}
          </div>
          {active.flag?.id === "custom" && (
            <details className="pd-custom-pride" open>
              <summary>Personalizar minha bandeira</summary>
              <div
                className="pd-custom-pride-stripes"
                role="group"
                aria-label="Faixas da bandeira"
              >
                {colors.map((color, index) => (
                  <button
                    type="button"
                    key={index}
                    style={{ background: color }}
                    aria-label={`Editar faixa ${index + 1}`}
                    aria-pressed={stripeIndex === index}
                    onClick={() => setStripe(index)}
                  />
                ))}
                <button
                  type="button"
                  disabled={colors.length >= 10}
                  onClick={() => {
                    editColors([...colors, "#ffffff"]);
                    setStripe(colors.length);
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  disabled={colors.length <= 2}
                  onClick={() =>
                    editColors(
                      colors.filter((_, index) => index !== stripeIndex),
                    )
                  }
                >
                  −
                </button>
              </div>
              <DarknessColorPicker
                label={`Cor da faixa ${stripeIndex + 1}`}
                value={colors[stripeIndex]}
                onChange={(color) =>
                  editColors(
                    colors.map((value, index) =>
                      index === stripeIndex ? color : value,
                    ),
                  )
                }
              />
            </details>
          )}
        </>
      )}
      <p>
        Aplicação imediata neste personagem. Você pode ajustar as cores abaixo.
      </p>
    </section>
  );
}
