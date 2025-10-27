const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: {
    main: "./src/frontend/index.tsx",
    overlay: "./src/frontend/overlayEntry.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist-react"),
    filename: "[name].bundle.js",
    clean: true,
  },
  devtool: process.env.NODE_ENV === "production" ? false : "eval-source-map",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
        },
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.module\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[name]__[local]--[hash:base64:5]",
                namedExport: false,
                exportLocalsConvention: "camelCase",
              },
              esModule: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
      chunks: ["main"],
    }),
    new HtmlWebpackPlugin({
      template: "./public/overlay.html",
      filename: "overlay.html",
      chunks: ["overlay"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public/icons",
          to: "icons",
        },
      ],
    }),
  ],
  target: "electron-renderer",
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "dist-react"),
      },
      {
        directory: path.join(__dirname, "public"),
        publicPath: "/",
      },
    ],
    port: 3000,
    hot: true,
    open: false,
    historyApiFallback: {
      rewrites: [{ from: /^\/overlay.html$/, to: "/overlay.html" }],
    },
  },
};
