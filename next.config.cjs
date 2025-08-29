const path = require("path");

module.exports = {
  webpackDevMiddleware: (config) => {
    config.watchOptions.ignored = [
      '**/node_modules/**',
      '**/.git/**',
      'C:/pagefile.sys',
      'C:/hiberfil.sys',
      'C:/System Volume Information'
    ];
    return config;
  },
};
