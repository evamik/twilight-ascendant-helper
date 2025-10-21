const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: {
    main: "./src/frontend/index.jsx",
    overlay: "./src/frontend/overlayEntry.jsx",
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
    extensions: [".js", ".jsx", ".css"],
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
  ],
  target: "electron-renderer",
  devServer: {
    static: {
      directory: path.join(__dirname, "dist-react"),
    },
    port: 3000,
    hot: true,
    open: false,
    historyApiFallback: {
      rewrites: [{ from: /^\/overlay.html$/, to: "/overlay.html" }],
    },
  },
};
