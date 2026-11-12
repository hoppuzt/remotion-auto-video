import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useEnter } from "./anim";
import { BarsScene, CompareScene, IconsScene } from "./ExtraScenes";
import { Callouts } from "./Flow";
import { StageView } from "./Stage";
import { Icon } from "./Icons";
import { IconName, Scene, Theme } from "./types";

const PADDING = 90;
const FADE_FRAMES = 8;

/** Ikon besar di atas judul/teks (opsional). */
const HeroIcon: React.FC<{ name?: IconName; theme: Theme; callouts?: string[] }> = ({
  name,
  theme,
  callouts,
}) => {
  const p = useEnter(2, { damping: 11, stiffness: 150 });
  if (!name) return null;
  return (
    <div
      style={{
        marginBottom: 44,
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.5, 1])})`,
      }}
    >
      <div style={{ position: "relative", width: 240, height: 240 }}>
        <Icon name={name} size={240} theme={theme} />
        {callouts && callouts.length > 0 ? <Callouts items={callouts} theme={theme} size={240} /> : null}
      </div>
    </div>
  );
};

const Title: React.FC<{ children: React.ReactNode; theme: Theme; size?: number }> = ({
  children,
  theme,
  size = 112,
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
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

const TitleScene: React.FC<{
  scene: Extract<Scene, { type: "title" }>;
  theme: Theme;
}> = ({ scene, theme }) => {
  const bar = useEnter(8);
  const sub = useEnter(14);
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: PADDING }}
    >
      <HeroIcon name={scene.icon} theme={theme} callouts={scene.callouts} />
      <Title theme={theme}>{scene.title}</Title>
      <div
        style={{
          marginTop: 48,
          height: 14,
          width: interpolate(bar, [0, 1], [0, 360]),
          borderRadius: 7,
          backgroundColor: theme.primary,
        }}
      />
      {scene.subtitle ? (
        <div
          style={{
            marginTop: 48,
            fontSize: 54,
            fontWeight: 400,
            color: theme.text,
            textAlign: "center",
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [30, 0])}px)`,
          }}
        >
          {scene.subtitle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const TextScene: React.FC<{
  scene: Extract<Scene, { type: "text" }>;
  theme: Theme;
}> = ({ scene, theme }) => {
  const body = useEnter(scene.title ? 10 : 0);
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: PADDING }}
    >
      <HeroIcon name={scene.icon} theme={theme} callouts={scene.callouts} />
      {scene.title ? (
        <div style={{ marginBottom: 56 }}>
          <Title theme={theme} size={72}>
            <span style={{ color: theme.primary }}>{scene.title}</span>
          </Title>
        </div>
      ) : null}
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          lineHeight: 1.25,
          color: theme.text,
          textAlign: "center",
          opacity: body,
          transform: `translateY(${interpolate(body, [0, 1], [50, 0])}px)`,
        }}
      >
        {scene.text}
      </div>
    </AbsoluteFill>
  );
};

const BulletItem: React.FC<{
  text: string;
  index: number;
  theme: Theme;
}> = ({ text, index, theme }) => {
  const p = useEnter(14 + index * 8);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 36,
        marginBottom: 44,
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: index % 2 === 0 ? theme.primary : theme.accent,
        }}
      />
      <div style={{ fontSize: 60, fontWeight: 700, color: theme.text, lineHeight: 1.2 }}>
        {text}
      </div>
    </div>
  );
};

const BulletsScene: React.FC<{
  scene: Extract<Scene, { type: "bullets" }>;
  theme: Theme;
}> = ({ scene, theme }) => (
  <AbsoluteFill style={{ justifyContent: "center", padding: PADDING }}>
    <div style={{ marginBottom: 72 }}>
      <Title theme={theme} size={88}>
        {scene.title}
      </Title>
    </div>
    {scene.items.map((item, i) => (
      <BulletItem key={i} text={item} index={i} theme={theme} />
    ))}
  </AbsoluteFill>
);

const StatScene: React.FC<{
  scene: Extract<Scene, { type: "stat" }>;
  theme: Theme;
}> = ({ scene, theme }) => {
  const p = useEnter();
  const label = useEnter(10);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: PADDING,
        paddingBottom: 360, // sisakan ruang untuk subtitle
      }}
    >
      <div
        style={{
          width: 760,
          height: 760,
          borderRadius: 380,
          backgroundColor: theme.primary,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${interpolate(p, [0, 1], [0.4, 1])})`,
          opacity: p,
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 800,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          {scene.value}
        </div>
      </div>
      <div
        style={{
          marginTop: 64,
          fontSize: 64,
          fontWeight: 700,
          color: theme.text,
          textAlign: "center",
          opacity: label,
          transform: `translateY(${interpolate(label, [0, 1], [30, 0])}px)`,
        }}
      >
        {scene.label}
      </div>
    </AbsoluteFill>
  );
};

/** Satu scene dengan fade in/out di awal & akhir. */
export const SceneView: React.FC<{
  scene: Scene;
  theme: Theme;
  durationInFrames: number;
  /** false pada mode flow: fade ditangani FlowStage. */
  fade?: boolean;
}> = ({ scene, theme, durationInFrames, fade = true }) => {
  const frame = useCurrentFrame();
  const opacity = !fade ? 1 : interpolate(
    frame,
    [0, FADE_FRAMES, durationInFrames - FADE_FRAMES, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  let content: React.ReactNode;
  switch (scene.type) {
    case "title":
      content = <TitleScene scene={scene} theme={theme} />;
      break;
    case "text":
      content = <TextScene scene={scene} theme={theme} />;
      break;
    case "bullets":
      content = <BulletsScene scene={scene} theme={theme} />;
      break;
    case "stat":
      content = <StatScene scene={scene} theme={theme} />;
      break;
    case "icons":
      content = <IconsScene scene={scene} theme={theme} />;
      break;
    case "compare":
      content = <CompareScene scene={scene} theme={theme} />;
      break;
    case "bars":
      content = <BarsScene scene={scene} theme={theme} />;
      break;
    case "stage":
      content = <StageView stage={scene.stage} labels={scene.labels} theme={theme} durationInFrames={durationInFrames} />;
      break;
  }

  return <AbsoluteFill style={{ opacity }}>{content}</AbsoluteFill>;
};
