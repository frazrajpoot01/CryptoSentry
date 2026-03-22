import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth/next";
// 👇 IMPORTANT: Adjust this path if your prisma client is exported from somewhere else!
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
    // Define the route specifically for the agent avatar
    agentAvatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            // 1. Verify clearance: Only logged-in agents can upload
            const session = await getServerSession();

            if (!session?.user?.email) {
                throw new UploadThingError("Unauthorized clearance");
            }

            // Pass the email to the next step (metadata)
            return { userEmail: session.user.email };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // 2. This code runs SECURELY on your server after the upload finishes!
            console.log("Upload complete for agent:", metadata.userEmail);
            console.log("File URL:", file.url);

            // 3. Update PostgreSQL directly! (No separate API route needed)
            await prisma.user.update({
                where: { email: metadata.userEmail },
                data: { image: file.url },
            });

            // What you return here goes to the frontend's onClientUploadComplete
            return { uploadedBy: metadata.userEmail, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;