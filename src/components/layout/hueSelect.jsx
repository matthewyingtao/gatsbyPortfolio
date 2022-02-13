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
      name: "Green",
      hue: 150,
    },
    {
      name: "Blue (default)",
      hue: 213,
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

  const ColorButton = ({ name, hue, i, open }) => (
    <button
      className={colorButtonStyle}
      style={{ "--btnHue": hue, "--idx": i }}
      onClick={() => {
        setOpen(false)
        setHue(hue)
      }}
      tabindex={open ? undefined : "-1"}
      aria-label={name}
    />
  )

  React.useEffect(() => {
    const storedHue = localStorage.getItem("hue", hue)
    if (storedHue !== null) {
      setHue(storedHue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    document.documentElement.style.setProperty("--hue", hue)
    localStorage.setItem("hue", hue)
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
          <ColorButton
            key={name}
            hue={colorHue}
            name={name}
            i={i}
            open={open}
          />
        ))}
      </div>
    </div>
  )
}
