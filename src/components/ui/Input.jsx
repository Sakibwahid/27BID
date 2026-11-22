import { twMerge } from "tailwind-merge";
import clsx from "clsx";

/**
 * @typedef {import('react').InputHTMLAttributes<HTMLInputElement>} InputHTMLProps
 * @typedef {InputHTMLProps & {
 *   label?: string,
 *   error?: string,
 *   icon?: import('react').ReactNode,
 *   options?: string[] // Array of options for dropdown
 * }} TextInputProps
 */

/**
 * TextInput component with optional dropdown support
 *
 * @param {TextInputProps} props - The props for the TextInput component
 * @returns {JSX.Element} The rendered input or select element
 */

export function Input({ className, label, error, icon, options, ...props }) {
    const baseStyles = "text-fifa-text placeholder:text-fifa-text-muted w-full block border border-fifa-border px-4 py-2.5 rounded-lg bg-fifa-surface appearance-none outline-none transition focus:border-fifa-accent focus:ring-2 focus:ring-fifa-accent/10";
    const errorStyles = "border-fifa-danger focus:border-fifa-danger focus:ring-fifa-danger/20";
    const classes = twMerge(clsx(baseStyles, error && errorStyles), className);

    return (
        <div className="mb-2">
            {label && <label className="mb-1 block text-sm text-fifa-text-secondary">{label}</label>}

            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}

                {options ? (
                    <select className={clsx(classes,icon && "pl-10")} {...props}>
                        {options.map((option, index) => (
                            <option key={index} value={option} className="bg-fifa-card">
                                {option}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input className={clsx(classes, icon && "pl-10")} {...props} />
                )}
            </div>

            {error && <p className="mt-1 text-sm text-fifa-danger">{error}</p>}
        </div>
    );
}
