import { graphql } from "gatsby"
import * as React from "react"
import Seo from "../components/layout/seo"
import { ProjectCard } from "../components/projectCard"
import { projectCardList } from "./projects.module.css"

export default function Projects({ data: { projects } }) {
  console.log(projects.nodes)

  return (
    <>
      <Seo />
      <h1>
        Projects<em>.</em>
      </h1>
      <div className={projectCardList}>
        {projects.nodes.map(({ name, description, img }) => (
          <ProjectCard
            key={name}
            name={name}
            description={description}
            img={img}
          />
        ))}
      </div>
    </>
  )
}

export const query = graphql`
  query {
    projects: allProjectsJson {
      nodes {
        ...ProjectCard
      }
    }
  }
`
