import React from "react";
import { AbsoluteFill, Audio, Sequence, Series, staticFile, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { Captions } from "./Captions";
import { loadThemeFont } from "./fonts";
import { SceneView } from "./SceneView";
import { VideoProps } from "./types";

export const Video: React.FC<VideoProps> = ({ theme, scenes, subtitles = true }) => {
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
              {scene.audio ? (
                <Sequence from={Math.round((scene.audioDelaySeconds ?? 0) * fps)}>
                  <Audio src={staticFile(scene.audio)} />
                </Sequence>
              ) : null}
              {subtitles ? <Captions captions={scene.captions} theme={theme} /> : null}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
