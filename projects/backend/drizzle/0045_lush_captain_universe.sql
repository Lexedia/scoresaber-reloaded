DROP INDEX IF EXISTS "leaderboards_search_idx";--> statement-breakpoint
ALTER TABLE "scoresaber-accounts" ADD COLUMN IF NOT EXISTS "rank" integer;--> statement-breakpoint
ALTER TABLE "scoresaber-accounts" ADD COLUMN IF NOT EXISTS "countryRank" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leaderboards_search_idx" ON "scoresaber-leaderboards" USING gin (to_tsvector('english', 
          translate("songName", '◇◆●○◎', 'ooooo') || 
          ' ' || 
          translate("songSubName", '◇◆●○◎', 'ooooo') || 
          ' ' || 
          translate("songAuthorName", '◇◆●○◎', 'ooooo') || 
          ' ' || 
          translate("levelAuthorName", '◇◆●○◎', 'ooooo')
        ));
