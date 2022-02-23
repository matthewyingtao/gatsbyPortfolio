import * as React from "react";
import { contact, showing } from "./contact.module.css";

export function Contact() {
  const contactEl = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            contactEl.current.classList.add(showing);
          } else {
            contactEl.current.classList.remove(showing);
          }
        });
      },
      {
        threshold: 1,
      }
    );

    observer.observe(contactEl.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={contactEl} id="contact" className={contact}>
      <h2>Contact</h2>
      <p>
        You can find me at{" "}
        <a href="mailto:matthew.yingtao@gmail.com">matthew.yingtao@gmail.com</a>
        . Feel free to email me if you have any corrections, suggestions,
        questions or simply to say hello! Another way to reach me is through{" "}
        <a
          href="https://www.linkedin.com/in/matthew-tao-727wysi/"
          target="_blank"
          rel="noreferrer"
        >
          my LinkedIn profile
        </a>
        .
      </p>
    </section>
  );
}
