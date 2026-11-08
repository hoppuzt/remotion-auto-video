import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { defaultProps, VideoProps } from "./types";

export const WIDTH = 1080;
export const HEIGHT = 1920; // 9:16

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="my-video"
      component={Video}
      width={WIDTH}
      height={HEIGHT}
      fps={defaultProps.fps}
      durationInFrames={defaultProps.fps * 3}
      defaultProps={defaultProps}
      // Durasi & fps dihitung dari input.json supaya video selalu pas dengan scene-nya.
      calculateMetadata={({ props }: { props: VideoProps }) => {
        const fps = props.fps ?? defaultProps.fps;
        const totalFrames = props.scenes.reduce(
          (sum, scene) => sum + Math.max(1, Math.round(scene.durationInSeconds * fps)),
          0
        );
        return {
          fps,
          durationInFrames: Math.max(1, totalFrames),
        };
      }}
    />
  );
};
