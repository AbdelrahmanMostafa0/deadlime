import { connection } from "next/server";
import { route } from "@/server/api";
import { listConnections } from "@/server/services/connections";

export const GET = route(async ({ actor }) => {
  await connection(); // no request input to read, so opt out of prerendering explicitly
  return listConnections(actor);
});
