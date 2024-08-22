CREATE TABLE IF NOT EXISTS "inbox" (
	"address" text PRIMARY KEY NOT NULL,
	"currentNode" text,
	"publicKey" text,
	"signedPublicKey" text,
	"encryptedPrivateKey" text,
	"randAuthString" text,
	"signature" text,
	"timestamp" date,
	CONSTRAINT "inbox_address_unique" UNIQUE("address"),
	CONSTRAINT "inbox_publicKey_unique" UNIQUE("publicKey"),
	CONSTRAINT "inbox_signedPublicKey_unique" UNIQUE("signedPublicKey"),
	CONSTRAINT "inbox_encryptedPrivateKey_unique" UNIQUE("encryptedPrivateKey"),
	CONSTRAINT "inbox_randAuthString_unique" UNIQUE("randAuthString"),
	CONSTRAINT "inbox_signature_unique" UNIQUE("signature")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodes" (
	"namespace" text PRIMARY KEY NOT NULL,
	"protocol_endpoint" text,
	"active" boolean,
	"node_id" integer,
	"public_key" text,
	"timestamp" date,
	CONSTRAINT "nodes_namespace_unique" UNIQUE("namespace"),
	CONSTRAINT "nodes_protocol_endpoint_unique" UNIQUE("protocol_endpoint"),
	CONSTRAINT "nodes_node_id_unique" UNIQUE("node_id"),
	CONSTRAINT "nodes_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inbox" ADD CONSTRAINT "inbox_currentNode_nodes_namespace_fk" FOREIGN KEY ("currentNode") REFERENCES "public"."nodes"("namespace") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
