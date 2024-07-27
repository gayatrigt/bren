import { type AppType } from "next/app";
import "~/styles/font.css";
import "~/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowWalletProvider } from "~/utils/rainbowConfig";
import Layout from "~/components/layout";
import Head from 'next/head';

const MyApp: AppType<{ excludeNavbar: boolean }> = ({ Component, pageProps }) => {
  return (
    <RainbowWalletProvider>
      <Head>
        <meta property="og:title" content="Bren" />
        <meta property="og:site_name" content="Bren" />
        <meta property="og:url" content="https://www.bren.lol" />
        <meta property="og:description" content="Recognize your Based frens with $bren" />
        <meta property="og:type" content="" />
        <meta property="og:image" content="" />
      </Head>
      {pageProps.excludeNavbar ? <Component {...pageProps} /> : <Layout>
        <Component {...pageProps} />
      </Layout>}
    </RainbowWalletProvider>
  );
};

export default MyApp;


