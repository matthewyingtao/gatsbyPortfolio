import React from "react"
import { IoMdColorPalette } from "react-icons/io"
import {
  dropdownWrapper,
  openbutton,
  picker,
  open as openstyle,
} from "./hueSelect.module.css"

const defaultHue = "213"

export function HueSelect() {
  const [hue, setHue] = React.useState(defaultHue)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    document.documentElement.style.setProperty("--hue", hue)
  }, [hue])

  return (
    <div className={dropdownWrapper}>
      <button
        className={openbutton}
        onClick={() => setOpen(!open)}
        aria-label="Open color selector"
      >
        <IoMdColorPalette style={{ fill: "var(--white)" }} />
      </button>
      <div className={[picker, open ? openstyle : ""].join(" ")}>
        <label className="visually-hidden" htmlFor="hue">
          Color Selector
        </label>
        <input
          type="range"
          id="hue"
          name="hue"
          min="0"
          max="360"
          value={hue}
          onChange={e => {
            setHue(e.target.value)
          }}
        />
      </div>
    </div>
  )
}
