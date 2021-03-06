import React from "react";
import { IoMdColorPalette } from "react-icons/io";
import {
  colorButton as colorButtonStyle,
  dropdownWrapper,
  open as openstyle,
  openbutton,
  picker,
} from "./hueSelect.module.css";

const ColorButton = ({ name, hue, i, onClick }) => (
  <button
    className={colorButtonStyle}
    style={{ "--btnHue": hue, "--idx": i }}
    onClick={onClick}
    aria-label={name}
  />
);

export function HueSelect() {
  const defaultHue = 213;

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
  ];

  const [hue, setHue] = React.useState(defaultHue);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const storedHue = localStorage.getItem("hue", hue);
    if (storedHue !== null) {
      setHue(storedHue);
    }
    // disabled because it should only run on page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--hue", hue);
    localStorage.setItem("hue", hue);
  }, [hue]);

  return (
    <div className={dropdownWrapper}>
      <button
        className={openbutton}
        onClick={() => setOpen(!open)}
        aria-label="Open color selector"
      >
        <IoMdColorPalette />
      </button>
      <div className={[picker, open ? openstyle : ""].join(" ")}>
        {colors.map(({ name, hue: buttonHue }, i) => (
          <ColorButton
            key={name}
            hue={buttonHue}
            name={name}
            i={i}
            onClick={() => {
              setOpen(false);
              setHue(buttonHue);
            }}
          />
        ))}
      </div>
    </div>
  );
}
