import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || (user.role !== 'admin' && user.role !== 'technician')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileUrl } = await req.json();
  if (!fileUrl) return Response.json({ error: 'fileUrl krävs' }, { status: 400 });

  // Fetch and parse CSV
  const res = await fetch(fileUrl);
  const text = await res.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const rows = lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim();
    });
    return obj;
  });

  let created_customers = 0;
  let skipped_customers = 0;
  let created_machines = 0;
  const errors = [];

  // Load existing customers once
  const existingCustomers = await base44.asServiceRole.entities.Customer.list();

  for (const row of rows) {
    if (!row.company_name) continue;

    // Find or create customer (match on company_name or org_number)
    let customer = existingCustomers.find(c =>
      (row.org_number && c.org_number === row.org_number) ||
      c.company_name?.toLowerCase() === row.company_name?.toLowerCase()
    );

    if (!customer) {
      const portalToken = Math.random().toString(36).substring(2, 18);
      customer = await base44.asServiceRole.entities.Customer.create({
        company_name: row.company_name,
        org_number: row.org_number || '',
        address: row.address || '',
        postal_code: row.postal_code || '',
        city: row.city || '',
        contact_person: row.contact_person || '',
        email: row.email || '',
        phone: row.phone || '',
        notes: row.notes || '',
        portal_token: portalToken,
      });
      existingCustomers.push(customer);
      created_customers++;
    } else {
      skipped_customers++;
    }

    // Create machine if model provided
    if (row.machine_model) {
      await base44.asServiceRole.entities.Machine.create({
        model: row.machine_model,
        serial_number: row.serial_number || '',
        service_date: row.latest_service_date || null,
        customer_id: customer.id,
        status: 'active',
        service_contract: 'none',
      });
      created_machines++;
    }
  }

  return Response.json({
    success: true,
    created_customers,
    skipped_customers,
    created_machines,
    errors,
  });
});