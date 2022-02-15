import React from "react"
import { Helmet } from "react-helmet"

const defaults = {
  title: "",
  description:
    "Matthew tao is an Auckland based front-end developer who focuses on the little things that make a website delightful.",
}

const keywords = ["CSS", "javascript", "front-end developer"]

const Seo = ({
  title = defaults.title,
  description = defaults.description,
}) => {
  return (
    <Helmet
      htmlAttributes={{ lang: "en" }}
      title={`${title} | Matthew Tao`}
      meta={[
        {
          name: `description`,
          content: description,
        },
        {
          name: `keywords`,
          content: keywords.join(", "),
        },
      ]}
    ></Helmet>
  )
}

export default Seo
