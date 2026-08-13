import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export function useServiceRecords() {
  const { user } = useAuth();
  const userRole = user?.role;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["serviceRecordsPage", userRole, user?.email],
    queryFn: async () => {
      if (userRole === "customer") {
        const allCustomers = await base44.entities.Customer.filter({ email: user.email });
        const cust = allCustomers[0] || null;
        if (cust) {
          const [r, m] = await Promise.all([
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-created_date"),
            base44.entities.Machine.filter({ customer_id: cust.id })
          ]);
          return { records: r, machines: m, customers: [cust], userCustomer: cust };
        }
        return { records: [], machines: [], customers: [], userCustomer: null };
      } else {
        const [r, m, c] = await Promise.all([
          base44.entities.ServiceRecord.list("-created_date"),
          base44.entities.Machine.list(),
          base44.entities.Customer.list()
        ]);
        return { records: r, machines: m, customers: c, userCustomer: null };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    keepPreviousData: true,
  });

  const load = () => queryClient.invalidateQueries({ queryKey: ["serviceRecordsPage"] });

  return {
    ...query,
    records: query.data?.records || [],
    machines: query.data?.machines || [],
    customers: query.data?.customers || [],
    userCustomer: query.data?.userCustomer || null,
    load
  };
}