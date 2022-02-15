import * as React from "react"
import { graphql } from "gatsby"
import { card, cardImage, projectInfo } from "./projectCard.module.css"
import { GatsbyImage, getImage } from "gatsby-plugin-image"

export function ProjectCard({ name, description, img }) {
  const image = getImage(img)

  return (
    <div className={card}>
      <GatsbyImage className={cardImage} image={image} />
      <div className={projectInfo}>
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}

export const query = graphql`
  fragment ProjectCard on ProjectsJson {
    img {
      childImageSharp {
        gatsbyImageData(
          aspectRatio: 1
          height: 448
          transformOptions: { cropFocus: CENTER }
        )
      }
    }
    name
    description
  }
`
