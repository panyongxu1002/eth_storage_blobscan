import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";
import { createBlobSelect } from "./common/selects";
import { serializeBlob, serializedBlobSchema } from "./common/serializers";
import { get_AWS_S3 } from "../../utils/aws_s3_blob";

const inputSchema = z
  .object({
    id: z.string(),
  })
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = serializedBlobSchema;

export const getByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}",
      tags: ["blobs"],
      summary:
        "retrieves blob details for given versioned hash or kzg commitment.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, blobStorageManager, expands }, input }) => {
    const { id } = input;

    const queriedBlob = await prisma.blob.findFirst({
      select: createBlobSelect(expands),
      where: {
        OR: [{ versionedHash: id }, { commitment: id }],
      },
    });

    if (!queriedBlob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
      });
    }

    // 老方法
    // const { data: blobData } = await retrieveBlobData(
    //   blobStorageManager,
    //   queriedBlob.dataStorageReferences
    // );

    // 取AWS_S3 blobData
    let blobData = await get_AWS_S3({ versionedHash: id });
    if (blobData.length) {
      // 去掉 ""
      blobData = blobData.slice(1,-1)
    }
    return serializeBlob({
      ...queriedBlob,
      data: blobData,
    });
  });
