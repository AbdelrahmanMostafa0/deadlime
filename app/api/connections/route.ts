import { route } from "@/server/api";
import { listConnections } from "@/server/services/connections";

export const GET = route(({ actor }) => listConnections(actor));
