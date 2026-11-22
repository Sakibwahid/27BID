import clsx from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

/**
 * @typedef {import('react').ButtonHTMLAttributes<HTMLButtonElement>} ButtonHTMLProps
 * @typedef {ButtonHTMLProps & {
*   variant?: 'filled' | 'outline',
*   size?: 'sm' | 'md' | 'lg',
* }} ButtonProps
*/

/**
* Button component
*
* @param {ButtonProps} props - The props for the Button component
* @returns {JSX.Element} The rendered button element
*/

export function Button({size="sm", variant="filled", className, children, ...props}) {
    const basestyles = [
        "inline-flex justify-center items-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifa-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
    ]
    const variants = {
        filled:
        "border border-transparent text-fifa-bg bg-fifa-accent hover:bg-fifa-accent-hover",
      outline: "border border-fifa-border text-fifa-text-secondary bg-transparent hover:bg-fifa-surface hover:text-fifa-text", 
    }

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      };
      
      const classes= twMerge(
        clsx(basestyles,variants[variant],sizes[size]), className
      );
    
    return (
        <button  className={classes} {...props}>
            {children}
        </button>
    );
}

   