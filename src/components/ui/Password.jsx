import { useState } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

/**
 * @typedef {import('react').InputHTMLAttributes<HTMLInputElement>} InputHTMLProps
 * @typedef {InputHTMLProps & {
 *   label?: string,
 *   error?: string,
 *   icon?: import('react').ReactNode,
 *   visibilityToggle?: boolean
 * }} PasswordInputProps
 */
/**
 * PasswordInput component
 *
 * @param {PasswordInputProps} props - The props for the PasswordInput component
 * @returns {JSX.Element} The rendered password input element with optional label, icon, and visibility toggle
 */
export function PasswordInput({
    className,
    label,
    error,
    icon,
    visibilityToggle = true,
    ...props
}) {
    const baseStyles =
        "text-fifa-text placeholder:text-fifa-text-muted w-full block border border-fifa-border px-4 py-2.5 rounded-lg bg-fifa-surface appearance-none outline-none transition focus:border-fifa-accent focus:ring-2 focus:ring-fifa-accent/10";
    const errorStyles =
        "border-fifa-danger focus:border-fifa-danger focus:ring-fifa-danger/20";
    const classes = twMerge(clsx(baseStyles, error && errorStyles, className));
    
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="mb-2">
            {label && (
                <label className="mb-1 block text-sm font-medium text-fifa-text-secondary">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type={showPassword ? "text" : "password"}
                    className={clsx(
                        classes,
                        icon && "pl-10",
                        visibilityToggle && "pr-10"
                    )}
                    {...props}
                />
                {visibilityToggle && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-fifa-text-muted transition hover:text-fifa-text"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-fifa-danger">{error}</p>}
        </div>
    );
}

