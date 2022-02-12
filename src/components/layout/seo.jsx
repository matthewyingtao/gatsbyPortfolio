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
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Roboto+Mono&display=swap"
        rel="stylesheet"
      />
    </Helmet>
  )
}

export default Seo
