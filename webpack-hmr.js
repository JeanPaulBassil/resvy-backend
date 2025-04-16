import nodeExternals from "webpack-node-externals";
import { RunScriptWebpackPlugin } from "run-script-webpack-plugin";

export default function (
  options,
  { HotModuleReplacementPlugin, WatchIgnorePlugin },
) {
  return {
    ...options,
    entry: ["webpack/hot/poll?100", options.entry],
    externals: [
      nodeExternals({
        allowlist: ["webpack/hot/poll?100"],
      }),
    ],
    node: {
      __dirname: true,
      __filename: true,
    },
    plugins: [
      ...options.plugins,
      new HotModuleReplacementPlugin(),
      new WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: false,
      }),
    ],
  };
}
