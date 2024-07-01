import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        Y: {
          100: "#FFFC00",
        },
        pu: {
          100: "#2B0035",
        },
        p: {
          100: "#BD44D9",
        },
        blu: {
          100: "#00B3DD",
        },
        W: {
          100: "#EEE",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
