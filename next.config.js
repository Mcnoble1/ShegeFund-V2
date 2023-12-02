const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  
  experimental: {
    appDir: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shegefundv2.netlify.app',
        // port: '',
        // pathname: '',
      },
    ],
  },
  
  reactStrictMode: true,

  webpack: (config, { isServer, buildId, dev, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
        new webpack.NormalModuleReplacementPlugin(
          /node:crypto/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
    }
    return config;
  },
};

module.exports = nextConfig;


