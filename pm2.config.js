module.exports = {
  apps: [
    {
      name: "mb2-translator",
      script: "./server.js",
      env: {
        NODE_ENV: "development",
	  },
	  env_production: {
		NODE_ENV: "production",
	  },
	},
  ],
};