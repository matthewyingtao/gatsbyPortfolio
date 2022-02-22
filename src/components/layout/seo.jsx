import React from "react";
import { Helmet } from "react-helmet";

const defaults = {
  title: "",
  description:
    "Matthew Tao is an Auckland based front-end developer who focuses on the little things that make a website delightful.",
};

const keywords = [
  "CSS",
  "javascript",
  "front-end developer",
  "portfolio website",
];

const Seo = ({
  title = defaults.title,
  description = defaults.description,
}) => {
  return (
    <Helmet
      htmlAttributes={{ lang: "en" }}
      title={`${title ? title + " | " : ""}Matthew Tao`}
      meta={[
        {
          name: `description`,
          content: description,
        },
        {
          name: `keywords`,
          content: keywords.join(", "),
        },
        {
          name: "google-site-verification",
          content: "4bVvZA3ngyZQr4cVZjcW42QoIjybeIeVGqEfcMB1Aus",
        },
        {
          name: "google-site-verification",
          content: "jLlPU6ex9KCAHyincJQywQffYI_12eq3GwjK1D7bCWw",
        },
        {
          property: "og:title",
          content: `${title ? title + " | " : ""}Matthew Tao`,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:url",
          content: "https://matthewtao.com",
        },
        {
          property: "og:image",
          content: "https://matthewtao.com/twitterCard.jpg",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:site",
          content: "@MatthewTao5",
        },
        {
          name: "twitter:title",
          content: `${title ? title + " | " : ""}Matthew Tao`,
        },
        {
          name: "twitter:description",
          content: description,
        },
        {
          name: "twitter:image",
          content: "https://matthewtao.com/twitterCard.jpg",
        },
      ]}
    />
  );
};

export default Seo;
