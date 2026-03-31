import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Papa from 'npm:papaparse';

// Helper: sleep for ms milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  let text = await res.text();
  
  // Remove BOM if present (often added by Excel)
  text = text.replace(/^\uFEFF/, '');

  const parsed = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase()
  });

  const rows = parsed.data;

  if (rows.length === 0) {
    return Response.json({ 
      error: 'Inga rader hittades eller fel format. Kontrollera att filen är en CSV och att första raden har rubrikerna.' 
    });
  }

  let created_customers = 0;
  let skipped_customers = 0;
  let created_machines = 0;
  let skipped_machines = 0;
  let skipped_rows = 0;
  const errors = [];

  // Load existing customers once
  const existingCustomers = await base44.asServiceRole.entities.Customer.list();
  const existingMachines = await base44.asServiceRole.entities.Machine.list();

  for (const row of rows) {
    if (!row.company_name) {
      skipped_rows++;
      continue;
    }

    // Find or create customer (match on org_number or company_name)
    let customer = existingCustomers.find(c =>
      (row.org_number && c.org_number && c.org_number === row.org_number) ||
      c.company_name?.toLowerCase() === row.company_name?.toLowerCase()
    );

    if (!customer) {
      const portalToken = Math.random().toString(36).substring(2, 18);
      // Retry on rate limit
      let attempts = 0;
      while (attempts < 5) {
        try {
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
            is_imported: true,
          });
          existingCustomers.push(customer);
          created_customers++;
          break;
        } catch (e) {
          if (e.status === 429) {
            attempts++;
            await sleep(1000 * attempts); // exponential backoff
          } else {
            errors.push(`Kund "${row.company_name}": ${e.message}`);
            break;
          }
        }
      }
    } else {
      skipped_customers++;
    }

    // Create machine if model provided
    if (customer && row.machine_model) {
      // Skip if serial number already exists
      const serialExists = row.serial_number &&
        existingMachines.some(m => m.serial_number && m.serial_number === row.serial_number);
      if (serialExists) {
        skipped_machines++;
      } else {
        let machineAttempts = 0;
        while (machineAttempts < 5) {
          try {
            const newMachine = await base44.asServiceRole.entities.Machine.create({
              model: row.machine_model,
              serial_number: row.serial_number || '',
              service_date: row.latest_service_date || null,
              customer_id: customer.id,
              status: 'active',
              service_contract: 'none',
            });
            existingMachines.push(newMachine);
            created_machines++;
            break;
          } catch (e) {
            if (e.status === 429) {
              machineAttempts++;
              await sleep(1000 * machineAttempts);
            } else {
              errors.push(`Maskin för "${row.company_name}": ${e.message}`);
              break;
            }
          }
        }
      }
    }

    // Small pause between rows to avoid rate limiting
    await sleep(150);
  }

  return Response.json({
    success: true,
    created_customers,
    skipped_customers,
    skipped_rows,
    created_machines,
    skipped_machines,
    errors,
  });
});