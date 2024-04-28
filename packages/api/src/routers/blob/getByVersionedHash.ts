import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { retrieveBlobData } from "../../utils";
import { get_AWS_S3 } from "../../utils/aws_s3_blob";
import { createBlobSelect } from "./common/selects";
import { serializeBlob, serializeBlobSchema } from "./common/serializers";

const inputSchema = z
  .object({
    versionedHash: z.string(),
  })
  .merge(createExpandsSchema(["transaction", "block"]));

// 定义Zod验证器
const outputSchema = z.object({
  data: z.any(),
});

export const getByVersionedHash = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/versionedHash/{versionedHash}",
      tags: ["blobs"],
      summary:
        "retrieves blob details for given versioned hash or kzg commitment.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .query(async ({ input }: any) => {
    const { versionedHash } = input;
    const blobData = await get_AWS_S3({ versionedHash });
    // console.log("🚀 ~ .query ~ blobData:", blobData);
    return {
      data: blobData,
    };
  });
