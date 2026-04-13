import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  vendorDataUpload: f({
    "text/csv": { maxFileSize: "8MB" },
    "application/json": { maxFileSize: "8MB" },
  })
    .middleware(async () => {
      const { userId, orgId } = await auth();
      if (!userId || !orgId) throw new Error("Unauthorized");
      return { userId, orgId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Vendor data uploaded:", file.name, "by org:", metadata.orgId);
      return { url: file.ufsUrl };
    }),

  evidenceDocument: f({
    pdf: { maxFileSize: "16MB" },
    image: { maxFileSize: "4MB" },
  })
    .middleware(async () => {
      const { userId, orgId } = await auth();
      if (!userId || !orgId) throw new Error("Unauthorized");
      return { userId, orgId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Evidence uploaded:", file.name, "by org:", metadata.orgId);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
