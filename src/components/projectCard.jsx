import { graphql } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import * as React from "react";
import { card, cardImage, projectInfo } from "./projectCard.module.css";

export function ProjectCard({ name, description, img }) {
  const image = getImage(img);

  return (
    <div className={card}>
      <GatsbyImage
        className={cardImage}
        image={image}
        alt={`${name} showcase`}
      />
      <div className={projectInfo}>
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
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
`;
