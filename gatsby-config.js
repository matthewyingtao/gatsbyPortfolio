module.exports = {
  flags: {
    FAST_DEV: true,
  },
  plugins: [
    `gatsby-plugin-layout`,
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
    "gatsby-plugin-slug",
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
  ],
}
