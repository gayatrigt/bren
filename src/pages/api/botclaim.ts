import { NextApiRequest, NextApiResponse } from 'next';
import { botclaim, botReminder, botReplySuccess } from './functions/botReply';
import { env } from '~/env';


const allFidsToNotify: any[] = [
    {
        "fid": 14640
    },
    {
        "fid": 276562
    },
    {
        "fid": 755074
    },
    {
        "fid": 10095
    },
    {
        "fid": 15069
    },
    {
        "fid": 379089
    },
    {
        "fid": 306404
    },
    {
        "fid": 815965
    },
    {
        "fid": 239
    },
    {
        "fid": 190081
    },
    {
        "fid": 394049
    },
    {
        "fid": 236581
    },
    {
        "fid": 3046
    },
    {
        "fid": 435071
    },
    {
        "fid": 11155
    },
    {
        "fid": 470962
    },
    {
        "fid": 4753
    },
    {
        "fid": 236671
    },
    {
        "fid": 360623
    },
    {
        "fid": 8447
    },
    {
        "fid": 326040
    },
    {
        "fid": 539
    },
    {
        "fid": 211697
    },
    {
        "fid": 435716
    },
    {
        "fid": 801266
    },
    {
        "fid": 738978
    },
    {
        "fid": 738574
    },
    {
        "fid": 798992
    },
    {
        "fid": 3642
    },
    {
        "fid": 348814
    },
    {
        "fid": 239748
    },
    {
        "fid": 656588
    },
    {
        "fid": 602
    },
    {
        "fid": 3621
    },
    {
        "fid": 411449
    },
    {
        "fid": 299247
    },
    {
        "fid": 411475
    },
    {
        "fid": 302556
    },
    {
        "fid": 499783
    },
    {
        "fid": 11352
    },
    {
        "fid": 809795
    },
    {
        "fid": 216511
    },
    {
        "fid": 747301
    },
    {
        "fid": 394023
    },
    {
        "fid": 689786
    },
    {
        "fid": 720162
    },
    {
        "fid": 243108
    },
    {
        "fid": 295385
    },
    {
        "fid": 415523
    },
    {
        "fid": 270228
    },
    {
        "fid": 230147
    },
    {
        "fid": 2433
    },
    {
        "fid": 268242
    },
    {
        "fid": 820411
    },
    {
        "fid": 268567
    },
    {
        "fid": 268485
    },
    {
        "fid": 270090
    },
    {
        "fid": 17355
    },
    {
        "fid": 328533
    },
    {
        "fid": 403619
    },
    {
        "fid": 507756
    },
    {
        "fid": 196215
    },
    {
        "fid": 398028
    },
    {
        "fid": 385627
    },
    {
        "fid": 609312
    },
    {
        "fid": 388302
    },
    {
        "fid": 248478
    },
    {
        "fid": 311933
    },
    {
        "fid": 421810
    },
    {
        "fid": 278675
    },
    {
        "fid": 4461
    },
    {
        "fid": 283144
    },
    {
        "fid": 455701
    },
    {
        "fid": 590111
    },
    {
        "fid": 520943
    },
    {
        "fid": 609255
    },
    {
        "fid": 251269
    },
    {
        "fid": 249965
    },
    {
        "fid": 429775
    },
    {
        "fid": 557868
    },
    {
        "fid": 296687
    },
    {
        "fid": 294226
    },
    {
        "fid": 16405
    },
    {
        "fid": 319999
    },
    {
        "fid": 674774
    },
    {
        "fid": 669527
    },
    {
        "fid": 462324
    },
    {
        "fid": 247143
    },
    {
        "fid": 270036
    },
    {
        "fid": 329898
    },
    {
        "fid": 16176
    },
    {
        "fid": 4914
    },
    {
        "fid": 493739
    },
    {
        "fid": 623964
    },
    {
        "fid": 506657
    },
    {
        "fid": 378176
    },
    {
        "fid": 237884
    },
    {
        "fid": 245017
    },
    {
        "fid": 13948
    },
    {
        "fid": 258335
    },
    {
        "fid": 437719
    },
    {
        "fid": 274272
    },
    {
        "fid": 335088
    },
    {
        "fid": 293760
    },
    {
        "fid": 621285
    },
    {
        "fid": 375831
    },
    {
        "fid": 510583
    },
    {
        "fid": 510693
    },
    {
        "fid": 545464
    },
    {
        "fid": 452094
    },
    {
        "fid": 252072
    },
    {
        "fid": 257094
    },
    {
        "fid": 518884
    },
    {
        "fid": 396480
    },
    {
        "fid": 360417
    },
    {
        "fid": 252198
    },
    {
        "fid": 428939
    },
    {
        "fid": 236070
    },
    {
        "fid": 326067
    },
    {
        "fid": 269991
    },
    {
        "fid": 353603
    },
    {
        "fid": 505088
    },
    {
        "fid": 396484
    },
    {
        "fid": 502656
    },
    {
        "fid": 302187
    },
    {
        "fid": 476375
    },
    {
        "fid": 509273
    },
    {
        "fid": 252999
    },
    {
        "fid": 518807
    },
    {
        "fid": 606175
    },
    {
        "fid": 472885
    },
    {
        "fid": 442982
    },
    {
        "fid": 451301
    },
    {
        "fid": 803255
    },
    {
        "fid": 751096
    },
    {
        "fid": 8004
    },
    {
        "fid": 751074
    },
    {
        "fid": 803274
    },
    {
        "fid": 751012
    },
    {
        "fid": 628616
    },
    {
        "fid": 751032
    },
    {
        "fid": 654450
    },
    {
        "fid": 196648
    },
    {
        "fid": 750972
    },
    {
        "fid": 327794
    },
    {
        "fid": 545121
    },
    {
        "fid": 750997
    },
    {
        "fid": 540157
    },
    {
        "fid": 293751
    },
    {
        "fid": 408746
    },
    {
        "fid": 386723
    },
    {
        "fid": 420554
    },
    {
        "fid": 490852
    },
    {
        "fid": 516028
    },
    {
        "fid": 6490
    },
    {
        "fid": 540167
    },
    {
        "fid": 440917
    },
    {
        "fid": 750948
    },
    {
        "fid": 519639
    },
    {
        "fid": 442911
    },
    {
        "fid": 245902
    },
    {
        "fid": 291104
    },
    {
        "fid": 250739
    },
    {
        "fid": 535389
    },
    {
        "fid": 414708
    },
    {
        "fid": 272115
    },
    {
        "fid": 234692
    },
    {
        "fid": 469679
    }
]
// const allFidsToNotify: any[] = [479, 469678]

interface NeynarUser {
    fid: number;
    username: string;
    // Add other properties as needed
}

interface NeynarResponse {
    users: NeynarUser[];
}

async function fetchUsernames(fids: number[]): Promise<Record<number, string>> {
    console.log('Fetching usernames for FIDs:', fids);

    const batchSize = 100;
    const usernames: Record<number, string> = {};

    for (let i = 0; i < fids.length; i += batchSize) {
        const batch = fids.slice(i, i + batchSize);

        try {
            const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${batch.join(',')}`;
            console.log(`Fetching batch ${i / batchSize + 1}, URL:`, url);

            const response = await fetch(url, {
                headers: {
                    'accept': 'application/json',
                    'api_key': env.NEYNAR_API_KEY
                }
            });

            console.log('Neynar API Response Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Neynar API Error Response:', errorText);
                throw new Error(`Failed to fetch user details from Neynar. Status: ${response.status}, Error: ${errorText}`);
            }

            const data: NeynarResponse = await response.json();

            data.users.forEach((user: NeynarUser) => {
                if (user.username) {
                    usernames[user.fid] = user.username;
                }
            });

            // Optional: Add a small delay between batches to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Error fetching batch ${i / batchSize + 1}:`, error);
            // Optionally, you can choose to continue with the next batch instead of throwing
            // throw error;
        }
    }

    console.log('Extracted Usernames:', JSON.stringify(usernames, null, 2));

    return usernames;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log(allFidsToNotify)

        const fidsArray = allFidsToNotify.map(item => item.fid);
        const usernames = await fetchUsernames(fidsArray);

        console.log(usernames)

        // 4. Send bot replies
        const replyPromises = Object.values(usernames).map(botclaim)

        const results = await Promise.all(replyPromises);

        console.log(results)

        res.status(200).json({
            message: 'Weekly notification process completed',
        });

    } catch (error) {
        console.error('Error in weekly notification process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}