import type { ClientSession, Decimal128 } from "mongodb";
import { z } from "zod";
import { tenantCol, withTransaction } from "@/core/db";
import { audit } from "@/core/audit";
import { emit } from "@/core/outbox";
import { newId } from "@/core/ids";
import { AppError } from "@/core/errors";
import { assertPermission, type Ctx } from "@/core/rbac/authorize";
import type { Encounter } from "@/modules/emr/schema";

export type ChargeStatus = "unbilled" | "invoiced" | "void";
export type Charge = {
  _id: string;
  patientId: string;
  encounterId: string;
  serviceId: string;
  serviceCode: string;
  name: string;
  kind: string;
  qty: number;
  unitPrice: Decimal128;
  taxCode: string;
  taxRate: Decimal128;
  revenueAccountSystem: string;
  status: ChargeStatus;
  invoiceId?: string;
  autoKey?: string; // idempotency key for rule-generated charges
  createdAt: Date;
  createdBy: string;
};

type Service = {
  _id: string; code: string; name: string; kind: string; price: Decimal128; taxCode: string;
  revenueAccountSystem: string; departmentId?: string; isDefaultConsultation?: boolean; active: boolean;
};

const charges = (orgId: string) => tenantCol<Charge>(orgId, "charges");

async function snapshot(
  orgId: string, svc: Service, s?: ClientSession,
): Promise<Pick<Charge, "unitPrice" | "taxCode" | "taxRate" | "serviceCode" | "name" | "kind" | "revenueAccountSystem">> {
  const tax = await tenantCol<{ code: string; rate: Decimal128 }>(orgId, "tax_codes").findOne({ code: svc.taxCode } as never, s);
  if (!tax) throw new AppError("VALIDATION", `Tax code ${svc.taxCode} not configured`);
  return {
    unitPrice: svc.price, taxCode: svc.taxCode, taxRate: tax.rate, serviceCode: svc.code, name: svc.name,
    kind: svc.kind, revenueAccountSystem: svc.revenueAccountSystem,
  };
}

const AddInput = z.object({ encounterId: z.string(), serviceId: z.string(), qty: z.number().int().positive().max(1000) });

export async function addCharge(ctx: Ctx, input: z.input<typeof AddInput>): Promise<Charge> {
  if (!ctx.permissions.includes("billing:create") && !ctx.permissions.includes("emr:update")) {
    throw new AppError("FORBIDDEN", "Missing permission billing:create");
  }
  const p = AddInput.safeParse(input);
  if (!p.success) throw new AppError("VALIDATION", p.error.message);
  const enc = await tenantCol<Encounter>(ctx.orgId, "encounters").findOne({ _id: p.data.encounterId } as never);
  if (!enc) throw new AppError("NOT_FOUND", "Encounter not found");
  const svc = await tenantCol<Service>(ctx.orgId, "services").findOne({ _id: p.data.serviceId, active: true } as never);
  if (!svc) throw new AppError("NOT_FOUND", "Service not found");

  return withTransaction(async (s) => {
    const c: Charge = {
      _id: newId(), patientId: enc.patientId, encounterId: enc._id, serviceId: svc._id, qty: p.data.qty,
      ...(await snapshot(ctx.orgId, svc, s)), status: "unbilled", createdAt: new Date(), createdBy: ctx.userId,
    };
    await charges(ctx.orgId).insertOne(c, s);
    await audit(s, { orgId: ctx.orgId, actorId: ctx.userId, action: "charge.add", resource: "charge", resourceId: c._id, after: { serviceCode: c.serviceCode, qty: c.qty } });
    await emit(s, ctx.orgId, "charge.created", { chargeId: c._id });
    return c;
  });
}

/**
 * Facility rule: completing an encounter creates one consultation charge using the doctor's
 * department default consultation service. Idempotent via the (encounterId, autoKey) unique index.
 * Called inside completeEncounter's transaction.
 */
export async function ensureConsultationCharge(ctx: Ctx, enc: Encounter, s: ClientSession): Promise<void> {
  const doc = await tenantCol<{ departmentId?: string }>(ctx.orgId, "staff").findOne({ _id: enc.doctorId } as never, s);
  const svcs = tenantCol<Service>(ctx.orgId, "services");
  const svc =
    (doc?.departmentId && (await svcs.findOne({ departmentId: doc.departmentId, isDefaultConsultation: true, active: true } as never, s))) ||
    (await svcs.findOne({ isDefaultConsultation: true, active: true } as never, s));
  if (!svc) {
    await audit(s, { orgId: ctx.orgId, actorId: ctx.userId, action: "charge.rule_missing", resource: "encounter", resourceId: enc._id, meta: { reason: "no default consultation service" } });
    return;
  }
  const c: Charge = {
    _id: newId(), patientId: enc.patientId, encounterId: enc._id, serviceId: svc._id, qty: 1,
    ...(await snapshot(ctx.orgId, svc, s)), status: "unbilled", autoKey: "consultation", createdAt: new Date(), createdBy: ctx.userId,
  };
  const res = await charges(ctx.orgId).updateOne({ encounterId: enc._id, autoKey: "consultation" } as never, { $setOnInsert: c } as never, s, { upsert: true });
  if (res.upsertedCount) {
    await audit(s, { orgId: ctx.orgId, actorId: ctx.userId, action: "charge.auto", resource: "charge", resourceId: c._id, after: { serviceCode: c.serviceCode } });
    await emit(s, ctx.orgId, "charge.created", { chargeId: c._id });
  }
}

export async function listUnbilledCharges(ctx: Ctx, patientId: string): Promise<Charge[]> {
  assertPermission(ctx, "billing:view");
  return charges(ctx.orgId).find({ patientId, status: "unbilled" } as never, { sort: { createdAt: 1 } });
}
