import { Receiver } from "@upstash/qstash";
import { NextRequest } from "next/server";

// Verifies the Upstash-Signature header against QStash's current/next
// signing keys, so /api/cron/import only runs for requests QStash actually
// sent — not anyone who guesses the URL.
export async function verifyQstashSignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  const signature = req.headers.get("upstash-signature");

  if (!currentSigningKey || !nextSigningKey || !signature) return false;

  const receiver = new Receiver({ currentSigningKey, nextSigningKey });

  try {
    return await receiver.verify({ signature, body: rawBody });
  } catch {
    return false;
  }
}
