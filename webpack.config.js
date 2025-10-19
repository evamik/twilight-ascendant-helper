const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/frontend/index.jsx",
    overlay: "./src/frontend/overlayEntry.jsx",
  },
  output: {
    path: path.resolve(__dirname, "dist-react"),
    filename: "[name].bundle.js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
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
