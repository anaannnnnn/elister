import type {
  ClientSession, Document, Filter, FindOptions, UpdateFilter, UpdateResult, Sort,
} from "mongodb";
import { getDb } from "./client";

type WithOrg<T> = T & { orgId: string };

/** Tenant-scoped collection. Every operation is forced to the given orgId. */
export interface TenantCollection<T extends Document> {
  find(filter?: Filter<T>, opts?: FindOptions & { sort?: Sort; limit?: number; skip?: number; session?: ClientSession }): Promise<WithOrg<T>[]>;
  findOne(filter: Filter<T>, s?: ClientSession): Promise<WithOrg<T> | null>;
  insertOne(doc: T, s?: ClientSession): Promise<void>;
  updateOne(filter: Filter<T>, update: UpdateFilter<T>, s?: ClientSession): Promise<UpdateResult>;
  count(filter: Filter<T>, s?: ClientSession): Promise<number>;
  aggregate<R extends Document = Document>(pipeline: Document[], s?: ClientSession): Promise<R[]>;
}

export function tenantCol<T extends Document = Document>(orgId: string, name: string): TenantCollection<T> {
  if (!orgId) throw new Error("tenantCol requires orgId");
  const col = async () => (await getDb()).collection<any>(name);
  const scope = (f: Filter<T> = {}) => ({ ...(f as object), orgId }) as Filter<any>;
  return {
    async find(filter, opts = {}) {
      return (await (await col()).find(scope(filter), opts).toArray()) as WithOrg<T>[];
    },
    async findOne(filter, s) {
      return (await (await col()).findOne(scope(filter), { session: s })) as WithOrg<T> | null;
    },
    async insertOne(doc, s) {
      await (await col()).insertOne({ ...(doc as object), orgId }, { session: s });
    },
    async updateOne(filter, update, s) {
      // forbid rewriting orgId
      const u = update as any;
      for (const op of ["$set", "$setOnInsert", "$unset"]) if (u[op] && "orgId" in u[op]) delete u[op].orgId;
      return (await col()).updateOne(scope(filter), u, { session: s });
    },
    async count(filter, s) {
      return (await col()).countDocuments(scope(filter), { session: s });
    },
    async aggregate(pipeline, s) {
      return (await (await col()).aggregate([{ $match: { orgId } }, ...pipeline], { session: s }).toArray()) as any;
    },
  };
}
