import React from "react"
import { graphql } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import { IoIosArrowRoundForward, IoIosArrowForward } from "react-icons/io"

import { BlogPostList } from "../components/blogPostList"
import Seo from "../components/layout/seo"
import {
  intro,
  portraitWrapper,
  portrait,
  pointer,
  blurb,
  focus,
  writing,
  contactButton,
} from "./index.module.css"
import { ArrowLink } from "../components/arrowLink"

function IntroSVG({ ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="273"
      height="144"
      fill="none"
      viewBox="0 0 273 144"
      {...props}
    >
      <g stroke="var(--white)" strokeLinecap="round" strokeWidth="3">
        <path
          style={{ transform: "rotate(15deg) translateX(20px)" }}
          d="M3.254 31.972C11.104 23.61 19.718 15.986 27.41 7.48c.517-.572 5.242-7.837 5.801-5.28 1.594 7.286 7.029 12.589 12.431 17.404 2.956 2.635 6.05 5.115 9.147 7.581 1.33 1.06 2.847 2.804 4.42 3.53 1.13.522-2.47-.43-3.714-.4-6.256.157-12.465 1.545-18.723 1.904-2.966.17-34.74-.288-34.623-1.35.32-2.887 6.401-4.79 8.38-5.863 6-3.256 11.971-6.568 18.262-9.239 1.495-.635 3.4-1.67 1.259.338-2.52 2.362-5.74 3.93-8.502 5.985-3.282 2.442-6.337 5.192-9.515 7.766-4.159 3.366-2.326 2.344.736.214 5.7-3.962 12.193-8.377 18.846-10.558.892-.293.912-.215.062.184a47.375 47.375 0 00-7.213 4.205c-5.167 3.652-.493 3.603 3.008 2.455 2.36-.774 4.707-1.634 6.967-2.67 1.437-.659 4.906-3.223 4.42-1.719-.64 1.98-7.608 5.96-1.228 4.42 3.412-.823 7.15-2.603 10.681-2.7 1.478-.042-1.354 2.51 1.167 1.963.53-.114 5.922-1.597 5.371-.276-.606 1.455-3.236 2.232-4.45 2.855-3.85 1.975-9.875 4.976-14.365 3.928-1.876-.437-3.862-2.41-5.709-3.192-.96-.406-3.008-.859-3.008-.859s.674.246.491.307c-.314.105-.147.588-.123.798.148 1.292-.45 2.174-.982 3.315-2.26 4.854-2.7 9.133-1.228 14.303 5.178 18.18 23.074 24.532 39.288 30.663 6.997 2.646 13.739 4.066 21.24 3.53 1.389-.1 12.354-.982 6.2-.982"
        ></path>
        <g className={writing}>
          <path
            pathLength="0.9"
            style={{ "--idx": 0 }}
            d="M143.586 43.022c-8.338 1.555-16.3 4.648-24.371 7.182-4.614 1.449-9.24 2.854-13.874 4.236-4.769 1.423.775.659 2.026.614 17.464-.624 34.634 1.013 52.057 1.934 5.39.285 10.807.453 16.206.276 6.152-.202.084-.333-1.658-.43"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 1 }}
            d="M144.691 56.834c-4.927.402-8.941 2.984-12.646 6.139-5.758 4.904-14.718 12.43-16.82 20.012-2.202 7.944 9.931 4.859 13.382 3.868 5.061-1.454 10.049-3.236 15.04-4.911 1.209-.406 2.422-.798 3.622-1.228 3.09-1.108-1.421.345-.368-.123"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 2 }}
            d="M180.602 57.387c-12.261 7.285-24.526 14.693-36.525 22.406-1.032.664-4.142 2.68-5.402 3.56-1.764 1.233.263.21.552.062 5.931-3.031 11.669-6.043 18.048-8.103 3.941-1.273 14.094-5.25 17.833-1.412 2.637 2.706-2.959 6.747-4.635 8.103-.736.596-5.232 3.227-2.332 3.99 1.84.485 3.173.019 4.174-.982"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 3 }}
            d="M202.149 74.514c-4.09.323-24.763 3.754-19.521 11.48 3.594 5.296 14.925 3.01 17.802-2.15.52-.932-3.976-1.895-2.302 1.014.946 1.642 2.138 3.29 3.868 4.174 2.585 1.321 3.492.694 5.126-.706"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 4 }}
            d="M231.983 67.332c-5.114 5.455-9.186 11.961-13.904 17.771-.969 1.194-4.818 4.909-4.696 7.029.065 1.117 1.88-1.275 2.578-2.149"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 5 }}
            d="M210.989 70.094c5.367 2.288 10.907 2.553 16.697 2.701.921.023 13.565.061 5.955.061"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 6 }}
            d="M259.055 70.646c-1.698 1.25-3.333 2.639-4.972 3.868"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 7 }}
            d="M271.21 81.144c-4.837-1.552-12.676-2.91-16.636 1.534-2.198 2.466 11.489 6.684 13.075 7.858 6.063 4.485-1.144 6.208-5.279 6.63-2.924.298-7.139.738-9.914-.583-1.528-.728.925-.552 1.074-.522"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 9 }}
            d="M127.011 131.972c1.65-5.114 4.632-9.01 8.042-13.137.648-.784 10.673-12.653 12.155-11.172.758.759-1.226 1.765-1.75 2.701-.974 1.742-2.23 3.838-2.363 5.893-.504 7.764 15.168 2.863 18.14 2.026 7.377-2.078 14.233-5.504 21.547-7.735 4.362-1.331.886 2.119-.492 3.99-4.071 5.532-11.276 10.23-13.873 16.636-.844 2.082-.16 3.518 2.179 3.499 2.779-.022 3.416-1.245 5.034-2.701"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 10 }}
            d="M197.729 130.867c3.083-.35 12.68-.563 14.242-4.113.902-2.05-5.323-1.558-5.647-1.534-4.272.311-8.967 1.199-12.8 3.192-7.42 3.859 9.713 9.169 12.001 9.699 4.559 1.056 10.147 2 14.795.798 3.709-.959-1.062-1.278-1.596-1.412"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 12 }}
            d="M259.055 109.873c-3.08 5.561-6.157 10.209-10.006 15.224-.698.909-1.743 2.627.307 2.21 2.016-.41 1.091-.397.859-.859"
          ></path>
          <path
            pathLength="0.9"
            style={{ "--idx": 13 }}
            d="M245.243 141.365c9.174-3.418-.194-2.783-.061-.798.232 3.486 9.517-.074 5.586-.86"
          ></path>
        </g>
      </g>
    </svg>
  )
}

export default function Home({ data: { posts } }) {
  return (
    <>
      <Seo />
      <div className={intro}>
        <div className={portraitWrapper}>
          <StaticImage
            className={portrait}
            placeholder="blurred"
            alt="portait of me!"
            src="../assets/portrait.webp"
            loading="eager"
          />
          <IntroSVG className={pointer} />
        </div>
        <div className={blurb}>
          <h1 style={{ lineHeight: 0.7 }}>Hi!</h1>
          <h2 style={{ marginBottom: "0.25rem" }}>
            I'm an Auckland-based <em>front-end</em> developer
          </h2>
          <p className={focus}>who focuses on</p>
          <ul style={{ marginTop: "-0.5rem" }}>
            <li>
              <IoIosArrowForward />
              <span>The value of soft skills</span>
            </li>
            <li>
              <IoIosArrowForward />
              <span>
                The <small>little</small> things that make a website delightful
              </span>
            </li>
            <li>
              <IoIosArrowForward />
              <span>
                Making the web a little bit <em>spicier!</em>
              </span>
            </li>
          </ul>
          <a href="#contact" className={contactButton}>
            Get in touch
            <IoIosArrowRoundForward size={32} />
          </a>
          <ArrowLink to={"/about"}>{"More about me"}</ArrowLink>
        </div>
      </div>
      <section>
        <h1>
          Blog<em>.</em>
        </h1>
        <BlogPostList posts={posts.edges.map(({ node }) => node)} />
        <ArrowLink to={"/blog"}>{"View all"}</ArrowLink>
      </section>
    </>
  )
}

export const query = graphql`
  query {
    posts: allMarkdownRemark(
      limit: 3
      sort: { order: DESC, fields: frontmatter___date }
    ) {
      edges {
        node {
          ...BlogPostCard
        }
      }
    }
  }
`
