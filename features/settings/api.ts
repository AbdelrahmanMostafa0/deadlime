"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { api, toApiError } from "@/lib/api-client";
import type { ConnectionDTO } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

export function useConnections() {
  return useQuery({
    queryKey: qk.connections,
    queryFn: async () => (await api.get<ConnectionDTO[]>("/connections")).data,
  });
}

export function useRevokeConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      await api.delete(`/connections/${encodeURIComponent(clientId)}`);
    },
    onSuccess: (_data, clientId) => {
      qc.setQueryData<ConnectionDTO[]>(qk.connections, (old) => old?.filter((c) => c.clientId !== clientId));
      toast.success("Disconnected. It'll find out within the hour.");
    },
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.connections }),
  });
}
