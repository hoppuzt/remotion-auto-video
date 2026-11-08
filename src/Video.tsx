import React from "react";
import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { loadThemeFont } from "./fonts";
import { SceneView } from "./SceneView";
import { VideoProps } from "./types";

export const Video: React.FC<VideoProps> = ({ theme, scenes }) => {
  const { fps } = useVideoConfig();
  const fontFamily = loadThemeFont(theme.font);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background theme={theme} />
      <Series>
        {scenes.map((scene, i) => {
          const durationInFrames = Math.max(1, Math.round(scene.durationInSeconds * fps));
          return (
            <Series.Sequence key={i} durationInFrames={durationInFrames}>
              <SceneView scene={scene} theme={theme} durationInFrames={durationInFrames} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
