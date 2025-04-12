/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://alerts.tourprism.com',
  generateRobotsTxt: true,
  exclude: [
    '/admin/*',
    '/session-expired',
    '/auth/*',
    '/profile/edit',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.SITE_URL || 'https://alerts.tourprism.com'}/server-sitemap.xml`,
    ],
  },
} 