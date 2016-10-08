module.exports = {
  entry: "./entry.js",
  output: {
    path: "./matrix-status",
    filename: "bundle.js",
    sourceMapFilename: "[file].map"
  },
  devtool: "source-map",
  node: {
    fs: "empty"
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style!css"
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
