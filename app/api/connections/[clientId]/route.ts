import { route } from "@/server/api";
import { revokeConnection } from "@/server/services/connections";

type P = { clientId: string };

export const DELETE = route<P>(({ actor, params }) => revokeConnection(actor, params.clientId));
