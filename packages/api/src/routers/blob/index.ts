import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlobId } from "./getByBlobId";
import { getByVersionedHash } from "./getByVersionedHash";

export const blobRouter = t.router({
  getAll,
  getByBlobId,
  getByVersionedHash,
});
