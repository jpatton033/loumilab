import { admin } from "./auth.ts";

export const AGREEMENT_REQUIRED = "Please review and accept the Spaces Hosting & Acceptable Use Agreement in your Spaces dashboard before continuing.";

/** True when the user still owes acceptance of the current required version. No-op (false) while nothing is published. Fails closed. */
export async function agreementBlocks(uid: string): Promise<boolean> {
  const { data, error } = await admin.rpc("legal_needs_acceptance", { _slug: "spaces-hosting", _uid: uid });
  if (error) return true;
  return data === true;
}

/** Phase 2 builds/compilation must call this too; builds remain disabled. */
export const requireForBuild = agreementBlocks;
