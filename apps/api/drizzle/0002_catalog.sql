CREATE TABLE "anime" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"banner_image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"content_rating" text DEFAULT 'general' NOT NULL,
	"studio_name" text,
	"creator_name" text,
	"release_year" integer,
	"rights_owner_name" text,
	"license_type" text,
	"permission_document_url" text,
	"is_original_content" boolean DEFAULT false NOT NULL,
	"is_fanmade" boolean DEFAULT false NOT NULL,
	"requires_attribution" boolean DEFAULT false NOT NULL,
	"attribution_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "anime_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "anime_genre" (
	"anime_id" text NOT NULL,
	"genre_id" text NOT NULL,
	CONSTRAINT "anime_genre_anime_id_genre_id_pk" PRIMARY KEY("anime_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "episode" (
	"id" text PRIMARY KEY NOT NULL,
	"anime_id" text NOT NULL,
	"season_id" text NOT NULL,
	"episode_number" integer NOT NULL,
	"episode_code" text NOT NULL,
	"title" text,
	"slug" text NOT NULL,
	"description" text,
	"duration_seconds" integer,
	"thumbnail_url" text,
	"bunny_video_id" text,
	"bunny_library_id" text,
	"playback_url" text,
	"embed_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "episode_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "genre_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" text PRIMARY KEY NOT NULL,
	"anime_id" text NOT NULL,
	"season_number" integer NOT NULL,
	"title" text,
	"description" text,
	"release_year" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode" ADD CONSTRAINT "episode_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode" ADD CONSTRAINT "episode_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;
