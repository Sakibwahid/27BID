/** @type {import('tailwindcss').Config} */
export const content = ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"];

export const theme = {
  extend: {
    colors: {
      primary: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        900: "#1e3a8a",
      },

      fifa: {
        bg: "#F2F0EF",
        surface: "#FFFEFA",
        card: "#FFFFFF",
        elevated: "#EEEDE6",
        border: "#D9DBD1",

        accent: "#527832",
        "accent-hover": "#446629",
        "accent-active": "#36531F",

        text: "#202A23",
        "text-secondary": "#4F5C52",
        "text-muted": "#68746A",

        success: "#367A38",
        warning: "#956300",
        danger: "#C13D3D",
        info: "#26746D",
      },
    },

    fontFamily: {
      // Elegant & Modern
      playfair: ["Playfair Display", "serif"],
      lora: ["Lora", "serif"],
      inter: ["Inter", "sans-serif"],

      // Futuristic
      orbitron: ["Orbitron", "sans-serif"],
      rajdhani: ["Rajdhani", "sans-serif"],
      exo: ["Exo", "sans-serif"],
      quantico: ["Quantico", "sans-serif"],

      // Minimalist & Aesthetic
      montserrat: ["Montserrat", "sans-serif"],
      manrope: ["Manrope", "sans-serif"],
      poppins: ["Poppins", "sans-serif"],
      urbanist: ["Urbanist", "sans-serif"],

      // High-End & Luxurious
      cinzel: ["Cinzel", "serif"],
      abril: ["Abril Fatface", "serif"],

      // Additional Fonts
      sora: ["Sora", "sans-serif"],
      spaceGrotesk: ["Space Grotesk", "sans-serif"],
      dmSans: ["DM Sans", "sans-serif"],
    },
  },
};

export const plugins = [];
