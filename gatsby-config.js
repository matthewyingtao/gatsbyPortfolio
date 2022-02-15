module.exports = {
  siteMetadata: {
    siteUrl: `https://www.matthewtao.com`,
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
        path: `${__dirname}/data/`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
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
    `gatsby-transformer-json`,
    "gatsby-plugin-slug",
    "gatsby-plugin-preact",
    `gatsby-plugin-react-helmet`,
    // Image processing
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-plugin-sharp`,
      options: {
        defaults: {
          placeholder: `blurred`,
        },
      },
    },
    `gatsby-transformer-sharp`,
    // Build and SEO optimizations
    `gatsby-plugin-netlify`,
    `gatsby-plugin-remove-fingerprints`,
    {
      resolve: `gatsby-plugin-canonical-urls`,
      options: {
        siteUrl: `https://www.matthewtao.com`,
      },
    },
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        excludes: ["/blog/tag/**", "/uses"],
      },
    },
    "gatsby-plugin-robots-txt",
  ],
}
