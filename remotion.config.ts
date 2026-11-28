import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
// WebGL untuk scene Three.js; swangle berjalan tanpa GPU (GitHub Actions).
Config.setChromiumOpenGlRenderer("swangle");
