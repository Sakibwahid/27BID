import clsx from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {import('react').HTMLAttributes<HTMLSpanElement>} TextHTMLProps
 * @typedef {TextHTMLProps & {
 *   variant?: 'primary' | 'secondary',
 *   size?: 'sm' | 'md' | 'lg',
 * }} TextProps
 */

/**
 * Text component
 *
 * @param {TextProps} props - The props for the Text component
 * @returns {JSX.Element} The rendered text element
 */

export function Text({ variant = "para", className, children, ...props }) {
    const basestyles = ["inline-block"]
    const variants = {
        heading: "text-4xl md:text-5xl text-fifa-text font-semibold font-[orbitron]",
        subheading: "text-xl md:text-2xl text-fifa-text font-[rajdhani]",
        para: "text-md text-fifa-text-secondary font-[rajdhani]"
    };
    const classes = twMerge(clsx(basestyles, variants[variant]), className);
    return (
      <span className={classes} {...props}>
      {children}
      </span>
        )
}