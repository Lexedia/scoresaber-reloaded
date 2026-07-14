ALTER TABLE "scoresaber-leaderboards" RENAME COLUMN "duckwalls" TO "crouchWalls";
ALTER TABLE "scoresaber-leaderboards" ADD COLUMN IF NOT EXISTS "dodgeWalls" integer;
