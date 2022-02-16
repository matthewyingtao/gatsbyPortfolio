import React from "react";
import { footer, divider } from "./footer.module.css";
import { IoLogoGithub } from "react-icons/io";
import { Contact } from "./contact";

export function Footer() {
  return (
    <footer className={footer}>
      <div className={divider}>
        <Star />
        <Diamond />
        <Cresent />
        <QuarterCircle />
        <Fish />
      </div>
      <Contact />
      <p>
        Made with 💖 by Matthew Tao using{" "}
        <a href="https://www.gatsbyjs.com/" target="_blank" rel="noreferrer">
          Gatsby JS
        </a>
        , hosted with{" "}
        <a href="https://www.netlify.com/" target="_blank" rel="noreferrer">
          Netlify
        </a>
      </p>
      {/* github logo */}
      <a
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
        }}
        href="https://github.com/matthewyingtao/gatsbyPortfolio"
        target="_blank"
        rel="noreferrer"
      >
        <IoLogoGithub size={24} /> Source Code
      </a>
    </footer>
  );
}

function Star() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="153"
      height="174"
      fill="none"
      viewBox="0 0 153 174"
    >
      <g filter="url(#shadow-light)">
        <path
          filter="url(#shadow-dark)"
          fill="var(--primary)"
          d="M60.516 16.886c-1.769 17.28 3.468 34.532 3.468 51.926 2.93 5.86-6.451 5.03-10.446 5.394-13.178 1.198-26.398 2.97-39.34 5.779-3.706.804-11.207 1.403-13.656 4.966-.85 1.235-.778 3.282.77 3.895 10.158 4.025 21.98 5.966 32.535 8.776 6.99 1.861 14.166 3.191 21.061 5.394.95.303 3.667.955 4.281 2.183 1.524 3.047.171 9.899.171 13.099v.97c0 17.963-.002 35.628 2.911 53.397.804 4.901 3.56-5.651 4.067-6.935 3.22-8.156 6.009-16.782 7.92-25.343 2.244-10.056 2.739-20.708 2.825-30.993.013-1.576-1.122-6.597 1.627-5.222 12.314 6.157 21.873 15.842 33.79 22.828 8.311 4.872 11 8.5 27.854 15.142-14.354-21.642-28-36.482-46.747-49.1-3.892-2.62 3.524-5.51 5.736-7.107 11.183-8.068 23.017-14.818 35.018-21.575 6.275-3.533 13.526-6.953 17.722-13.057.794-1.154-2.872-.2-3.938-.17-14.221.394-28.637 1.187-42.637 3.809l-.204.038c-5.279.989-11.038 2.067-15.635 5.013-.627.402-1.333 1.91-1.798 1.328-2.342-2.928-2.49-9.815-3.425-13.228-2.97-10.833-6.642-21.458-10.445-32.02-.698-1.94-9.305-21.59-9.632-21.063-3.463 5.595-3.212 15.62-3.853 21.876z"
        ></path>
      </g>
      <defs>
        <filter id="shadow-light">
          <feOffset dx="-4" dy="-4" />

          <feGaussianBlur stdDeviation="4" result="offset-blur" />
          <feComposite
            operator="out"
            in="SourceGraphic"
            in2="offset-blur"
            result="inverse"
          />
          <feFlood
            flood-color="hsl(var(--hue), 55%, 40%)"
            flood-opacity="1"
            result="color"
          />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>

        <filter id="shadow-dark">
          <feOffset dx="4" dy="4" />

          <feGaussianBlur stdDeviation="4" result="offset-blur" />
          <feComposite
            operator="out"
            in="SourceGraphic"
            in2="offset-blur"
            result="inverse"
          />
          <feFlood
            flood-color="hsl(var(--hue), 55%, 80%)"
            flood-opacity="1"
            result="color"
          />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
    </svg>
  );
}

function Diamond() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="95"
      height="107"
      fill="none"
      viewBox="0 0 95 107"
    >
      <g filter="url(#shadow-light)">
        <path
          filter="url(#shadow-dark)"
          fill="var(--primary)"
          d="M35.21 1.067C22.28 19.538-2.754 48.953.246 53.453c5 2.5 2.053 2.724 6.511 4.268 2.377.822 4.017 2.286 6.212 3.478 8.373 4.548 16.02 9.045 23.544 14.971 8.92 7.026 17.58 13.67 25.345 21.991.373.399 7.36 8.41 7.393 8.386.386-.281.627-2.112.807-2.547.89-2.141 1.876-4.215 2.671-6.398 3.192-8.764 7.415-16.95 11.182-25.47 4.3-9.723 8.028-19.98 9.815-30.5.298-1.754 1.932-9.684-.31-10.872-4.252-2.25-7.912-4.945-12.052-7.516C69.72 16.012 58.411 8.728 47.51.384 46.357-.5 41.61-5.503 39.62-4.96c-1.777.485-3.525 4.76-4.41 6.026z"
        ></path>
      </g>
    </svg>
  );
}

function Cresent() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="71"
      height="87"
      fill="none"
      viewBox="0 0 71 87"
    >
      <g filter="url(#shadow-light)">
        <path
          filter="url(#shadow-dark)"
          fill="var(--primary)"
          d="M44.173.07c5.958-.287 11.826.39 17.767.497-2.043 0-5.61 3.058-9.505 5.87-6.469 4.673-12.424 10.293-15.84 17.674-2.493 5.383-1.22 11.658-.373 17.27.85 5.64 2.384 10.76 4.752 15.934 3.815 8.336 8.59 16.08 16.586 20.934 4.227 2.566 8.607 5.078 12.921 7.517 2.856 1.614-8.502.294-9.154.218h-.009c-14.197-1.65-29.132-4.554-42.21-10.5-7.36-3.344-13.764-8.106-16.742-15.902-3-7.852-2.681-16.416-1.584-24.6C2.29 23.726 8.633 16.11 17.648 9.637 25.695 3.858 34.22.55 44.173.07z"
        ></path>
      </g>
    </svg>
  );
}

function QuarterCircle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="60"
      height="69"
      fill="none"
      viewBox="0 0 60 69"
    >
      <g filter="url(#shadow-light)">
        <path
          filter="url(#shadow-dark)"
          fill="var(--primary)"
          d="M1.752 54.159C2.564 38.424.235 15.789 0 .07c3.263 0 7.83-.464 10.72.98 2.928 1.465 6.167 1.634 8.967 3.434 1.535.987 4.328 2.318 6.166 2.522 3.09.343 8.86 4.447 11.035 6.621 4.421 4.422 7.678 8.087 11.034 13.417 4.162 6.61 7.824 14.238 9.809 21.894 1.282 4.947 2.363 9.158 2.172 14.328-.069 1.847-3.032 1.12-4.414 1.12-3.584 0-7.392 1.262-11.175 1.262-1.7 0-2.677.308-4.309.63-8.441 1.669-17.367 1.214-25.923 1.577-1.672.07-12.82 1.953-12.82-1.051 0-4.236.271-8.418.49-12.646z"
        ></path>
      </g>
    </svg>
  );
}

function Fish() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="139"
      height="65"
      viewBox="0 0 139 65"
      fill="none"
    >
      <g filter="url(#shadow-light)">
        <path
          filter="url(#shadow-dark)"
          fill="var(--primary)"
          d="M23 6.16953C15.1867 8.991 5.5 15.5 2 21.5584C5 29.5 8.2892 35.3264 10.2222 38.0029C16.1244 46.1751 23.1175 55.5246 33.0556 59.0029C41.2442 61.8689 53.4084 61.5496 61.8333 60.5584C70.0166 59.5957 81.6541 57.8252 88 52.114C89.5817 50.6904 99.5346 42.2296 98.4444 41.5029C89.4183 35.4854 117.466 51.9384 127 57.114C129.214 58.3158 134.691 60.8856 135.5 62.5029C137.072 65.6465 137 57.948 137 56.3362C137 42.2543 130.358 28.944 128.444 15.0029C127.727 9.77864 128.274 3.63264 123.222 8.33619C118.181 13.0298 111.852 17.5576 106.167 21.4473C93.9843 29.7826 100.574 24.0401 89.8333 17.0584C76.5844 8.4466 63.9779 1.84246 47.7778 2.00286C39.7658 2.08219 30.5959 3.42656 23 6.16953Z"
        ></path>
      </g>
    </svg>
  );
}
