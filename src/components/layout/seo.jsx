import React from "react"
import { Helmet } from "react-helmet"

const defaults = {
  title: "Matthew Tao",
  description: "Matthew tao's personal website.",
}

const Seo = ({
  title = defaults.title,
  description = defaults.description,
}) => {
  return (
    <Helmet
      htmlAttributes={{ lang: "en" }}
      title={title}
      meta={[
        {
          name: `description`,
          content: description,
        },
      ]}
    ></Helmet>
  )
}

export default Seo
