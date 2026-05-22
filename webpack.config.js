const path = require("path");

const externals = {
  react: "react",
  "react-dom": "react-dom",
};

const commonJsConfig = {
  entry: "./src/index.ts",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: "commonjs2", // exports module.exports = ...
    },
    clean: false,
  },
  externals,
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};

const esModuleConfig = {
  ...commonJsConfig,
  output: {
    filename: "index.esm.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: "module", // exports as ES Module
    },
  },
  experiments: {
    outputModule: true,
  },
};

module.exports = [commonJsConfig, esModuleConfig];
