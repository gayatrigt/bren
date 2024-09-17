-- Delete all transactions on FARCASTER platform
DELETE FROM "Transaction" WHERE platform = 'FARCASTER';

-- Delete FarcasterDetails for users without a tgUsername
DELETE FROM "FarcasterDetails"
WHERE "userId" IN (SELECT id FROM "User" WHERE "tgUsername" IS NULL);

-- Delete TelegramDetails for users without a tgUsername (if this table exists and has a relationship)
DELETE FROM "TelegramDetails"
WHERE "userId" IN (SELECT id FROM "User" WHERE "tgUsername" IS NULL);

-- Delete UserRankings for users without a tgUsername
DELETE FROM "UserRankings"
WHERE "userId" IN (SELECT id FROM "User" WHERE "tgUsername" IS NULL);

-- Delete WeeklyPoints for users without a tgUsername
DELETE FROM "WeeklyPoints"
WHERE "userId" IN (SELECT id FROM "User" WHERE "tgUsername" IS NULL);

-- Delete Account entries for users without a tgUsername
DELETE FROM "Account"
WHERE "userId" IN (SELECT id FROM "User" WHERE "tgUsername" IS NULL);

-- Delete Session entries for users without a tgUsername
DELETE FROM "Session"
WHERE "userId" IN (SELECT id FROM "User" WHERE "tgUsername" IS NULL);

-- Finally, delete users without a tgUsername
DELETE FROM "User" WHERE "tgUsername" IS NULL;