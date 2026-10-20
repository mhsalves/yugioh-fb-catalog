const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable default image optimization
  },
  assetPrefix: isProd ? '/yugioh-fb-catalog/' : '',
  basePath: isProd ? '/yugioh-fb-catalog' : '',
  output: 'export'
};

export default nextConfig;
