import * as React from "react"
import Seo from "../components/layout/seo"
import { IoMdMail, IoIosPhonePortrait, IoMdDocument } from "react-icons/io"
import { contactCard } from "./contact.module.css"

export default function Contact() {
  return (
    <>
      <Seo />
      <h1>
        Contact<em>.</em>
      </h1>
      <button className={contactCard}>
        <IoMdMail size={48} />
        <h4>Email</h4>
        <p>matthew.yingtao@gmail.com</p>
      </button>
      <p>
        <IoIosPhonePortrait /> 028 4578 527
      </p>
      <p>
        <IoMdDocument />
        Resume
      </p>
    </>
  )
}
