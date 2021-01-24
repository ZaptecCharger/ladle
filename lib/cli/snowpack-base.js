import path from "path";
import fs from "fs";
// @ts-ignore
import { fileURLToPath } from "url";
import { createConfiguration } from "snowpack";

/**
 * @param {string} storyGlob
 */
const getStoryFolder = (storyGlob) => {
  const parts = storyGlob.split("/");
  if (storyGlob === "" || !fs.existsSync(path.join(process.cwd(), parts[0]))) {
    throw Error(
      `Story glob ${storyGlob} must match an existing folder. The ${parts[0]} folder was not found.`
    );
  }
  return parts[0];
};

const babelPresets = [
  ["@babel/preset-react", { runtime: "automatic" }],
  [
    "@babel/preset-env",
    {
      targets: { esmodules: true },
      bugfixes: true,
      modules: false,
    },
  ],
];

/**
 * @param {any} extendConfig
 * @param pluginOptions {import("../shared/types").PluginOptions}
 */
const getSnowpackConfig = async (extendConfig, pluginOptions) => {
  //@ts-ignore
  const configPath = path.join(process.cwd(), "./.ladle/config.mjs");
  const configExists = fs.existsSync(configPath);
  const providerPath = path.join(process.cwd(), "./.ladle/provider.tsx");
  const providerPathJs = path.join(process.cwd(), "./.ladle/provider.js");
  const providerExists =
    fs.existsSync(providerPath) || fs.existsSync(providerPathJs);
  const dirname = fileURLToPath(import.meta.url);
  const storyFolder = getStoryFolder(pluginOptions.storyGlob);
  const bundlerConfig = {
    ...extendConfig,
    packageOptions: {
      knownEntrypoints: ["react/jsx-runtime"],
    },
    mount: {
      [path.join(dirname, "../../app/public/")]: { url: "/", static: false },
      [path.join(dirname, "../../app/src/")]: { url: "/" },
      [path.join(dirname, "../../shared/")]: { url: "/" },
      [path.join(process.cwd(), storyFolder)]: { url: "/stories" },
      ...(configExists || providerExists
        ? { [path.join(process.cwd(), ".ladle")]: { url: "/" } }
        : {}),
      ...(extendConfig.mount ? extendConfig.mount : {}),
    },
    plugins: [
      "@snowpack/plugin-react-refresh",
      [
        "@snowpack/plugin-babel",
        {
          input: [".ts", ".tsx"],
          transformOptions: {
            presets: ["@babel/preset-typescript", ...babelPresets],
          },
        },
      ],
      [
        "@snowpack/plugin-babel",
        {
          input: [".js", ".mjs", ".jsx"],
          transformOptions: {
            presets: ["@babel/preset-flow", ...babelPresets],
          },
        },
      ],
      [
        path.join(dirname, "../snowpack-plugin/snowpack-plugin.js"),
        pluginOptions,
      ],
      ...(extendConfig.plugins ? extendConfig.plugins : []),
    ],
  };
  return createConfiguration(bundlerConfig);
};

export default getSnowpackConfig;