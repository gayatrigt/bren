import { type AppType } from "next/app";
import "~/styles/font.css";
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main className="">
      <Component {...pageProps} />
    </main>
  );
};

export default MyApp;
