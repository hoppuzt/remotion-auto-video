import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { SAFE_PADDING_BOTTOM, SAFE_PADDING_TOP, SAFE_PADDING_X, useEnter } from "./anim";
import { Icon } from "./Icons";
import { BarItem, ComparePanel, IconItem, Scene, Theme } from "./types";

const frame: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
  paddingTop: SAFE_PADDING_TOP,
  paddingLeft: SAFE_PADDING_X,
  paddingRight: SAFE_PADDING_X,
  paddingBottom: SAFE_PADDING_BOTTOM,
};

const Heading: React.FC<{ text: string; theme: Theme; size?: number; marginBottom?: number }> = ({
  text,
  theme,
  size = 84,
  marginBottom = 56,
}) => {
  const p = useEnter();
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.1,
        color: theme.text,
        textAlign: "center",
        marginBottom,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

// ------------------------------------------------------------------ icons

const IconCard: React.FC<{
  item: IconItem;
  index: number;
  total: number;
  theme: Theme;
  compact: boolean;
}> = ({ item, index, total, theme, compact }) => {
  const p = useEnter(10 + index * 7, { damping: 12, stiffness: 140 });
  const spansTwo = total % 2 === 1 && index === total - 1;
  const accent = index % 2 === 0 ? theme.primary : theme.accent;
  return (
    <div
      style={{
        gridColumn: spansTwo ? "1 / span 2" : undefined,
        justifySelf: spansTwo ? "center" : undefined,
        width: spansTwo ? 434 : undefined,
        height: compact ? 290 : 360,
        borderRadius: 48,
        backgroundColor: "#FFFFFF",
        boxShadow: `0 10px 0 ${accent}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: compact ? 14 : 26,
        padding: "0 24px",
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
      }}
    >
      <Icon name={item.icon} size={compact ? 130 : 170} theme={theme} />
      <div
        style={{
          fontSize: compact ? 38 : 44,
          fontWeight: 700,
          lineHeight: 1.15,
          color: theme.text,
          textAlign: "center",
        }}
      >
        {item.label}
      </div>
    </div>
  );
};

export const IconsScene: React.FC<{
  scene: Extract<Scene, { type: "icons" }>;
  theme: Theme;
}> = ({ scene, theme }) => {
  const items = scene.items.slice(0, 6);
  const compact = items.length > 4;
  return (
    <AbsoluteFill style={frame}>
      {scene.title ? <Heading text={scene.title} theme={theme} /> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: compact ? 28 : 36,
          width: 900,
          paddingBottom: 10,
        }}
      >
        {items.map((item, i) => (
          <IconCard key={i} item={item} index={i} total={items.length} theme={theme} compact={compact} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- compare

const PanelRow: React.FC<{
  text: string;
  tone: NonNullable<ComparePanel["tone"]>;
  color: string;
  theme: Theme;
  delay: number;
}> = ({ text, tone, color, theme, delay }) => {
  const p = useEnter(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
      }}
    >
      <div style={{ flexShrink: 0, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {tone === "good" ? (
          <Icon name="check" size={52} theme={theme} />
        ) : tone === "bad" ? (
          <Icon name="cross" size={52} theme={theme} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color }} />
        )}
      </div>
      <div style={{ fontSize: 42, fontWeight: 600, lineHeight: 1.2, color: theme.text }}>{text}</div>
    </div>
  );
};

const ComparePanelView: React.FC<{
  panel: ComparePanel;
  color: string;
  fromX: number;
  delay: number;
  theme: Theme;
}> = ({ panel, color, fromX, delay, theme }) => {
  const p = useEnter(delay);
  const tone = panel.tone ?? "neutral";
  return (
    <div
      style={{
        width: 900,
        borderRadius: 48,
        backgroundColor: "#FFFFFF",
        boxShadow: `0 10px 0 ${color}`,
        padding: "36px 48px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [fromX, 0])}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 6 }}>
        {panel.icon ? <Icon name={panel.icon} size={84} theme={theme} /> : null}
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, color }}>{panel.title}</div>
      </div>
      {panel.items.slice(0, 4).map((item, i) => (
        <PanelRow key={i} text={item} tone={tone} color={color} theme={theme} delay={delay + 12 + i * 6} />
      ))}
    </div>
  );
};

export const CompareScene: React.FC<{
  scene: Extract<Scene, { type: "compare" }>;
  theme: Theme;
}> = ({ scene, theme }) => {
  const vs = useEnter(14, { damping: 10, stiffness: 160 });
  return (
    <AbsoluteFill style={frame}>
      {scene.title ? <Heading text={scene.title} theme={theme} size={72} marginBottom={36} /> : null}
      <ComparePanelView panel={scene.left} color={theme.primary} fromX={-300} delay={4} theme={theme} />
      <div
        style={{
          margin: "-6px 0",
          zIndex: 1,
          width: 104,
          height: 104,
          borderRadius: 52,
          backgroundColor: theme.text,
          color: theme.background,
          fontSize: 44,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${interpolate(vs, [0, 1], [0, 1])})`,
        }}
      >
        VS
      </div>
      <ComparePanelView panel={scene.right} color={theme.accent} fromX={300} delay={10} theme={theme} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------- bars

const BarRow: React.FC<{
  item: BarItem;
  max: number;
  unit: string;
  index: number;
  theme: Theme;
}> = ({ item, max, unit, index, theme }) => {
  const rowIn = useEnter(8 + index * 6);
  const grow = useEnter(14 + index * 6, { damping: 18, stiffness: 70 });
  const color = index % 2 === 0 ? theme.primary : theme.accent;
  const widthPct = Math.max(0, Math.min(100, (item.value / max) * 100)) * grow;
  const shown = item.display ?? `${Math.round(item.value * Math.min(1, grow) * 10) / 10}${unit}`;
  return (
    <div
      style={{
        width: 900,
        opacity: rowIn,
        transform: `translateY(${interpolate(rowIn, [0, 1], [30, 0])}px)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 46, fontWeight: 700, color: theme.text, lineHeight: 1.15, maxWidth: 640 }}>
          {item.label}
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color }}>{shown}</div>
      </div>
      <div style={{ height: 64, borderRadius: 32, backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${widthPct}%`, borderRadius: 32, backgroundColor: color }} />
      </div>
    </div>
  );
};

export const BarsScene: React.FC<{
  scene: Extract<Scene, { type: "bars" }>;
  theme: Theme;
}> = ({ scene, theme }) => {
  const items = scene.items.slice(0, 5);
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <AbsoluteFill style={frame}>
      <Heading text={scene.title} theme={theme} size={76} marginBottom={64} />
      <div style={{ display: "flex", flexDirection: "column", gap: 50 }}>
        {items.map((item, i) => (
          <BarRow key={i} item={item} max={max} unit={scene.unit ?? ""} index={i} theme={theme} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
