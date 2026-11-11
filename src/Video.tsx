import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  Series,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Background } from "./Background";
import { resolveTheme } from "./eras";
import { Captions } from "./Captions";
import { ChapterChip, ChapterRail, FLOW_OVERLAP, FlowCaptions, FlowStage } from "./Flow";
import { loadThemeFont } from "./fonts";
import { SceneView } from "./SceneView";
import { ArtName, MusicConfig, Theme, VideoProps } from "./types";

const DEFAULT_MUSIC_VOLUME = 0.22;
const DEFAULT_DUCK = 0.35;
const DEFAULT_FADE_IN = 1;
const DEFAULT_FADE_OUT = 1.5;
const DEFAULT_SFX_VOLUME = 0.5;
const DUCK_RAMP_DOWN_FRAMES = 8;
const DUCK_RAMP_UP_FRAMES = 14;
/** Lama crossfade antar latar scene (frame). */
const BG_FADE_FRAMES = 14;
/** Ruang (px) di dasar layar yang disisakan untuk ilustrasi latar. */
const ART_CLEARANCE = 380;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Nama bawaan ("upbeat") atau path di public/ ("music/lagu-saya.mp3"). */
const audioPath = (value: string, folder: "music" | "sfx"): string =>
  value.includes("/") || value.includes(".") ? value : `${folder}/${value}.mp3`;

const normalizeMusic = (music?: MusicConfig) => {
  if (!music) return null;
  const cfg = typeof music === "string" ? { track: music } : music;
  if (!cfg.track || cfg.track === "none") return null;
  return {
    src: audioPath(cfg.track, "music"),
    volume: cfg.volume ?? DEFAULT_MUSIC_VOLUME,
    duck: cfg.duck ?? DEFAULT_DUCK,
    fadeIn: cfg.fadeInSeconds ?? DEFAULT_FADE_IN,
    fadeOut: cfg.fadeOutSeconds ?? DEFAULT_FADE_OUT,
  };
};

export const Video: React.FC<VideoProps> = ({
  theme,
  scenes,
  subtitles = true,
  music,
  defaultSfx = "none",
  sfxVolume = DEFAULT_SFX_VOLUME,
  motion,
}) => {
  const flow = motion === "flow";
  const { fps, durationInFrames: totalFrames } = useVideoConfig();
  const fontFamily = loadThemeFont(theme.font);

  // Garis waktu: awal & durasi tiap scene (dalam frame), dan rentang narasi untuk ducking musik.
  let cursor = 0;
  const timeline = scenes.map((scene) => {
    const durationInFrames = Math.max(1, Math.round(scene.durationInSeconds * fps));
    const start = cursor;
    cursor += durationInFrames;
    return { scene, start, durationInFrames };
  });

  // Latar per scene: scene yang punya `bg` memulai segmen baru; scene tanpa `bg` melanjutkan segmen sebelumnya.
  type Segment = { theme: Theme; art?: ArtName; from: number; to: number };
  const segments: Segment[] = [];
  const sceneArt: boolean[] = [];
  const sceneThemes: Theme[] = timeline.map(({ scene, start, durationInFrames }) => {
    if (scene.bg) {
      segments.push({ theme: resolveTheme(theme, scene.bg), art: scene.bg.art, from: start, to: start + durationInFrames });
    } else if (segments.length > 0) {
      segments[segments.length - 1].to = start + durationInFrames;
    }
    const current = segments.length > 0 ? segments[segments.length - 1] : undefined;
    sceneArt.push(Boolean(current?.art));
    return current ? current.theme : theme;
  });

  const narration = timeline
    .filter(({ scene }) => scene.audio)
    .map(({ scene, start, durationInFrames }) => {
      const from = start + Math.round((scene.audioDelaySeconds ?? 0) * fps);
      const length =
        scene.audioDurationSeconds !== undefined
          ? Math.ceil(scene.audioDurationSeconds * fps)
          : Math.max(1, start + durationInFrames - from);
      return { from, to: from + Math.max(1, length) };
    });

  const musicCfg = normalizeMusic(music);
  const musicVolume = (frame: number): number => {
    if (!musicCfg) return 0;
    const fadeIn = musicCfg.fadeIn > 0
      ? interpolate(frame, [0, musicCfg.fadeIn * fps], [0, 1], clamp)
      : 1;
    const fadeOut = musicCfg.fadeOut > 0
      ? interpolate(frame, [totalFrames - musicCfg.fadeOut * fps, totalFrames], [1, 0], clamp)
      : 1;
    let ducking = 1;
    for (const { from, to } of narration) {
      const d = interpolate(
        frame,
        [from - DUCK_RAMP_DOWN_FRAMES, from, to, to + DUCK_RAMP_UP_FRAMES],
        [1, musicCfg.duck, musicCfg.duck, 1],
        clamp
      );
      ducking = Math.min(ducking, d);
    }
    return musicCfg.volume * fadeIn * fadeOut * ducking;
  };

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background theme={theme} />
      {segments.map((seg, i) => {
        const fade = seg.from > 0 ? BG_FADE_FRAMES : 0;
        const from = Math.max(0, seg.from - fade);
        return (
          <Sequence key={`bg-${i}`} from={from} durationInFrames={Math.max(1, seg.to - from)} layout="none">
            <Background theme={seg.theme} art={seg.art} fadeInFrames={fade} />
          </Sequence>
        );
      })}
      {musicCfg ? (
        <Audio
          src={staticFile(musicCfg.src)}
          loop
          loopVolumeCurveBehavior="extend"
          volume={musicVolume}
        />
      ) : null}
      {flow ? (
        <>
          <ChapterRail
            starts={timeline.map((x) => x.start)}
            total={timeline.reduce((m, x) => Math.max(m, x.start + x.durationInFrames), 0)}
            colors={sceneThemes.map((th) => th.primary)}
            track={sceneThemes[0].text}
          />
          {timeline.map(({ scene, start, durationInFrames }, i) => {
            const sceneTheme = sceneThemes[i];
            const sfx = scene.sfx ?? defaultSfx;
            const kicker = scene.kicker ?? ("title" in scene ? scene.title : undefined);
            return (
              <Sequence
                key={i}
                from={start}
                durationInFrames={durationInFrames + (i < timeline.length - 1 ? FLOW_OVERLAP : 0)}
                layout="none"
              >
                <FlowStage durationInFrames={durationInFrames}>
                  <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: sceneArt[i] ? ART_CLEARANCE : 0 }}>
                    <SceneView scene={scene} theme={sceneTheme} durationInFrames={durationInFrames} fade={false} />
                  </div>
                </FlowStage>
                <ChapterChip index={i} count={timeline.length} kicker={kicker} theme={sceneTheme} duration={durationInFrames + (i < timeline.length - 1 ? FLOW_OVERLAP : 0)} />
                {sfx && sfx !== "none" ? <Audio src={staticFile(audioPath(sfx, "sfx"))} volume={sfxVolume} /> : null}
                {scene.audio ? (
                  <Sequence from={Math.round((scene.audioDelaySeconds ?? 0) * fps)}>
                    <Audio src={staticFile(scene.audio)} />
                  </Sequence>
                ) : null}
                {subtitles ? <FlowCaptions captions={scene.captions} highlight={scene.highlight} theme={sceneTheme} /> : null}
              </Sequence>
            );
          })}
        </>
      ) : (
      <Series>
        {timeline.map(({ scene, durationInFrames }, i) => {
          const sceneTheme = sceneThemes[i];
          const sfx = scene.sfx ?? defaultSfx;
          return (
            <Series.Sequence key={i} durationInFrames={durationInFrames}>
              <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: sceneArt[i] ? ART_CLEARANCE : 0 }}>
                <SceneView scene={scene} theme={sceneTheme} durationInFrames={durationInFrames} />
              </div>
              {sfx && sfx !== "none" ? (
                <Audio src={staticFile(audioPath(sfx, "sfx"))} volume={sfxVolume} />
              ) : null}
              {scene.audio ? (
                <Sequence from={Math.round((scene.audioDelaySeconds ?? 0) * fps)}>
                  <Audio src={staticFile(scene.audio)} />
                </Sequence>
              ) : null}
              {subtitles ? <Captions captions={scene.captions} theme={sceneTheme} /> : null}
            </Series.Sequence>
          );
        })}
      </Series>
      )}
    </AbsoluteFill>
  );
};
