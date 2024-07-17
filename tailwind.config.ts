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
        B: {
          40: "#A09FA0",
          60: "#707070",
          100: "#111011",
        },
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
        G: {
          100: "#31AE7A",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
