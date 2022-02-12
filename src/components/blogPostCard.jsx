import * as React from "react"
import { Link } from "gatsby"
import { card, date as dateStyle } from "./blogPostCard.module.css"

export function BlogPostCard({ title, date, description, slug }) {
  return (
    <Link style={{ textDecoration: "none" }} to={`/blog/${slug}`}>
      <div className={card}>
        <time className={dateStyle} dateTime={date}>
          {date}
        </time>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </Link>
  )
}