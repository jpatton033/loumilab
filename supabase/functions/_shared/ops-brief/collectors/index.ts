import type { Collector } from "../types.ts";
import { merchantsCollector } from "./merchants.ts";
import { paymentsCollector } from "./payments.ts";
import { leadsCollector } from "./leads.ts";
import { knowledgeCollector } from "./knowledge.ts";
import { websiteChangesCollector } from "./changes.ts";
import { auditCollector, pricingChangesCollector } from "./governance.ts";
import { securityCollector } from "./security.ts";
import { developmentCollector, systemCollector } from "./system.ts";
import {
  customerExperienceCollector,
  disputesCollector,
  ordersCollector,
  payoutsCollector,
  refundsCollector,
  revenueCollector,
  seoCollector,
  subscriptionsCollector,
  websiteTrafficCollector,
} from "./pending.ts";

/**
 * The brief is assembled by walking this ordered registry. Adding a future
 * Loumilab product means adding one collector file and one entry here, plus a
 * module toggle in Super Admin — no renderer or scheduler changes.
 */
export const collectors: Collector[] = [
  ordersCollector,
  merchantsCollector,
  paymentsCollector,
  payoutsCollector,
  revenueCollector,
  subscriptionsCollector,
  refundsCollector,
  disputesCollector,
  customerExperienceCollector,
  leadsCollector,
  knowledgeCollector,
  websiteTrafficCollector,
  websiteChangesCollector,
  seoCollector,
  pricingChangesCollector,
  auditCollector,
  securityCollector,
  systemCollector,
  developmentCollector,
];

export const collectorKeys = collectors.map((c) => c.key);
