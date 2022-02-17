import React from "react";
import { Helmet } from "react-helmet";

const defaults = {
  title: "",
  description:
    "Matthew tao is an Auckland based front-end developer who focuses on the little things that make a website delightful.",
};

const keywords = ["CSS", "javascript", "front-end developer"];

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
