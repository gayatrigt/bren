import { type AppType } from "next/app";
import "~/styles/font.css";
import "~/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowWalletProvider } from "~/utils/rainbowConfig";
import Layout from "~/components/layout";
import Head from 'next/head';
import { SessionProvider } from "next-auth/react";

const MyApp: AppType<{ session: any, excludeNavbar: boolean }> = ({
  Component,
  pageProps: { session, excludeNavbar, ...pageProps }
}) => {
  return (
    <SessionProvider session={session}>
      <RainbowWalletProvider>
        <Head>
          <meta property="og:title" content="Bren" />
          <meta property="og:site_name" content="Bren" />
          <meta property="og:url" content="https://www.bren.lol" />
          <meta property="og:description" content="Recognize your Based frens with $bren" />
          <meta property="og:type" content="" />
          <meta property="og:image" content="" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-bren.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-bren.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icon-bren.png" />
          <link rel="manifest" href="/icon-bren.png" />
          <link rel="shortcut icon" href="/icon-bren.png" />
        </Head>
        {excludeNavbar ? (
          <Component {...pageProps} />
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </RainbowWalletProvider>
    </SessionProvider>
  );
};

export default MyApp;


