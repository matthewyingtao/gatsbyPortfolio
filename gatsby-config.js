module.exports = {
  siteMetadata: {
    siteUrl: `https://matthewtao.netlify.app`,
  },
  flags: {
    FAST_DEV: true,
    PARALLEL_SOURCING: true,
    PARALLEL_QUERY_RUNNING: true,
  },
  plugins: [
    `gatsby-plugin-layout`,
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [`Roboto Mono\:400`, `Inter\:400,700,900`],
        display: "swap",
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blogPosts`,
        path: `${__dirname}/data/posts`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1080,
              withWebp: true,
              wrapperStyle: `width: 100%; margin: var(--space-xl) auto;`,
              showCaptions: true,
              quality: 75,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-responsive-iframe`,
        ],
      },
    },
    "gatsby-plugin-preact",
    "gatsby-plugin-slug",
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    // Build and SEO optimizations
    `gatsby-plugin-remove-fingerprints`,
    {
      resolve: `gatsby-plugin-canonical-urls`,
      options: {
        siteUrl: `https://matthewtao.netlify.app`,
      },
    },
    `gatsby-plugin-sitemap`,
    "gatsby-plugin-robots-txt",
  ],
}
