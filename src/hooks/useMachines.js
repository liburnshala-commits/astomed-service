import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export function useMachines() {
  const { user } = useAuth();
  const userRole = user?.role;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["machinesPage", userRole, user?.email],
    queryFn: async () => {
      if (userRole === "customer") {
        const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
        const cust = ownCustomers[0];
        if (cust) {
          const [m, r, p] = await Promise.all([
            base44.entities.Machine.filter({ customer_id: cust.id }, "-created_date"),
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-created_date"),
            base44.entities.Product.list()
          ]);
          return { machines: m.filter(x => !x.is_deleted), records: r, customers: [cust], products: p };
        }
        return { machines: [], records: [], customers: [], products: [] };
      } else {
        const [m, c, r, p] = await Promise.all([
          base44.entities.Machine.list("-created_date"),
          base44.entities.Customer.list(),
          base44.entities.ServiceRecord.list("-created_date"),
          base44.entities.Product.list()
        ]);
        return { machines: m.filter(x => !x.is_deleted), customers: c, records: r, products: p };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    keepPreviousData: true,
  });

  const load = () => queryClient.invalidateQueries({ queryKey: ["machinesPage"] });

  return {
    ...query,
    machines: query.data?.machines || [],
    records: query.data?.records || [],
    customers: query.data?.customers || [],
    products: query.data?.products || [],
    load
  };
}