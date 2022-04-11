module.exports = {
  trailingSlash: "always",
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
      resolve: `gatsby-plugin-google-fonts-with-attributes`,
      options: {
        fonts: [`Roboto Mono\:400`, `Manrope\:400,600,800`],
        display: "swap",
        attributes: {
          rel: "stylesheet preload prefetch",
        },
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
              linkImagesToOriginal: false,
              maxWidth: 800,
              withWebp: true,
              wrapperStyle: `width: 100%; margin: var(--space-xl) auto;`,
              showCaptions: true,
              quality: 75,
            },
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              inlineCodeMarker: "±",
            },
          },
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
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-react-helmet-canonical-urls`,
      options: {
        siteUrl: `https://www.matthewtao.com`,
      },
    },
    `gatsby-plugin-minify`,
    `gatsby-plugin-netlify`,
    `gatsby-plugin-remove-fingerprints`,
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        output: `/`,
        excludes: ["/blog/tag/**"],
      },
    },
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        host: "https://www.matthewtao.com",
        sitemap: "https://www.matthewtao.com/sitemap-index.xml",
      },
    },
  ],
};
