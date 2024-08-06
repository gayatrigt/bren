import { Transaction } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { useState } from "react";
import Form from "~/components/Form";

interface UserDetails {
  allowanceLeft: number;
}

interface HomeProps {
  userDetails?: UserDetails;
  error?: string;
  excludeNavbar: boolean;
  fid?: number;
  text?: string;
  parent?: string;
}

const Home: NextPage<HomeProps> = ({ userDetails, excludeNavbar, error, text, parent }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCast = () => {
    setIsLoading(true)
    console.log("hi")
    try {

      const castData: any = {
        text: `Can I get an invite for bren @yele.eth @gayatri`,
      };

      if (parent) {
        castData.parent = parent;
      }

      window.parent.postMessage({
        type: "createCast",
        data: {
          cast: {
            ...(parent && { parent: parent }),
            text: `${text} Can I get an invite for bren @yele.eth @gayatri`,
            embeds: []
          }
        }
      }, "*");
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <>
      <section className="w-full">
        <div className="min-h-screen overflow-hidden w-full bg-Y-100 flex flex-col items-center">
          <img src="/icons/logo.svg" alt="Logo" className="w-24 h-24 mb-4" />
          <h1 className="text-4xl text-center font-bold">
            Recognize your
            Base frens
          </h1>
          <span className="text-base text-center mb-6">
            Select the points from your allowance and a value that you want to reward.
            <br /> You can then tag the person in the cast and make them feel appreciated!
          </span>
          {error ? (
            <div className="text-center text-pu-100 justify-center flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4">You are not Whitelisted to tip</h2>
              {!isLoading && <button
                className="rounded border border-p-100 bg-white w-32 py-2 font-bold text-pu-100
           shadow-[3px_3px_0px_0px_#000] text-lg hover:bg-pu-100 hover:text-white transition-colors"
                onClick={handleCast}
              >
                Get Invite
              </button>}
              {isLoading && <div
                className="px-4 h-[40px] flex items-center
                 justify-center rounded border border-p-100 bg-white w-32 py-2 font-bold text-pu-100
           shadow-[3px_3px_0px_0px_#000] text-lgtransition-colors"
              >
                <span className="loader"></span>
              </div>}
            </div>
          ) : userDetails ? (
            <Form allowanceLeft={userDetails.allowanceLeft} text={text} parent={
              parent} />
          ) : null}
        </div>
      </section>
    </>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps<HomeProps> = async (context) => {
  const { fid: fidParam, text, parent } = context.query;

  // Parse fid from the URL parameter
  const fid = fidParam ? parseInt(fidParam as string, 10) : undefined;

  if (!fid) {
    return {
      props: {
        error: "Invalid or missing FID in the URL.",
        excludeNavbar: true
      }
    };
  }

  try {
    const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_BOT_BASE_URL}/api/getUserStats?fid=${fid}`);

    if (!statsResponse.ok) {
      if (statsResponse.status === 404) {
        return {
          props: {
            error: "User not found or not whitelisted.",
            excludeNavbar: true,
            fid,
            text: text as string | undefined,
            parent: parent as string | undefined
          }
        };
      }
      throw new Error('Failed to fetch user details');
    }

    const statsData = await statsResponse.json();

    console.log(statsData);

    if (statsData.weeklyAllowanceLeft === undefined) {
      return {
        props: {
          error: "User not eligible for Bren tipping.",
          excludeNavbar: true,
          fid,
          text: text as string | undefined,
          parent: parent as string | undefined
        }
      };
    }

    const userDetails: UserDetails = {
      allowanceLeft: statsData.weeklyAllowanceLeft || 0
    };

    return {
      props: {
        userDetails,
        excludeNavbar: true,
        fid,
        text: text as string | undefined,
        parent: parent as string | undefined
      }
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return {
      props: {
        error: "An error occurred while fetching user details. Please try again later.",
        excludeNavbar: true,
        fid,
        text: text as string | undefined,
        parent: parent as string | undefined
      }
    };
  }
};