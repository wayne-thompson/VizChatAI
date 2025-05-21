CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"visualization_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "visualizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text,
	"description" text,
	"image_base64" text NOT NULL,
	"initial_summary" text,
	"analysis" jsonb,
	"insights" text[],
	"share_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tags" text[],
	"is_public" boolean DEFAULT false,
	CONSTRAINT "visualizations_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_visualization_id_visualizations_id_fk" FOREIGN KEY ("visualization_id") REFERENCES "public"."visualizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visualizations" ADD CONSTRAINT "visualizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;