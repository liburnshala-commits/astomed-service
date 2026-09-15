import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

export default async function(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { org_number } = body;
    
    if (!org_number) {
      return Response.json({ exists: false });
    }

    const base44 = createClientFromRequest(req);
    // Check if the org_number belongs to a customer, using service role for public access
    const customers = await base44.asServiceRole.entities.Customer.filter({ org_number });
    
    if (customers.length > 0) {
      return Response.json({ exists: true, company_name: customers[0].company_name });
    } else {
      return Response.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking org number:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}