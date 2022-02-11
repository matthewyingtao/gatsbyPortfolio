import React from "react"
import { IoMdColorPalette } from "react-icons/io"
import {
  dropdownWrapper,
  openbutton,
  picker,
  open as openstyle,
  colorButton as colorButtonStyle,
} from "./hueSelect.module.css"

export function HueSelect() {
  const defaultHue = 213

  const colors = [
    {
      name: "Blue (default)",
      hue: 213,
    },
    {
      name: "Green",
      hue: 150,
    },
    {
      name: "Purple",
      hue: 256,
    },
    {
      name: "Magenta",
      hue: 330,
    },
    {
      name: "Red",
      hue: 0,
    },
  ]

  const [hue, setHue] = React.useState(defaultHue)
  const [open, setOpen] = React.useState(false)

  const ColorButton = ({ name, hue, i }) => (
    <button
      className={colorButtonStyle}
      style={{ "--btnHue": hue, "--idx": i }}
      onClick={() => {
        setOpen(false)
        setHue(hue)
      }}
      aria-label={name}
    />
  )

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
        {colors.map(({ name, hue: colorHue }, i) => (
          <ColorButton key={name} hue={colorHue} name={name} i={i} />
        ))}
      </div>
    </div>
  )
}
