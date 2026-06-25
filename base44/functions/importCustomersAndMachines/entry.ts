import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Papa from 'npm:papaparse';

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

  // Remove the first line if it contains only separators (e.g. empty Excel export row)
  const lines = text.split('\n');
  if (lines.length > 0 && lines[0].replace(/[;,\s]/g, '') === '') {
    lines.shift();
  }
  text = lines.join('\n');

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

  // Load existing customers and machines once
  const existingCustomers = await base44.asServiceRole.entities.Customer.list();
  const existingMachines = await base44.asServiceRole.entities.Machine.list();
  const existingLeads = await base44.asServiceRole.entities.ServiceContractLead.filter({});

  // 1. Prepare new customers
  const newCustomerDataList = [];
  const processedCompanies = new Set();
  
  for (const row of rows) {
    if (!row.company_name) continue;
    
    let customer = null;
    if (row.org_number) {
      customer = existingCustomers.find(c => c.org_number && c.org_number.trim() === row.org_number.trim());
    }
    if (!customer && row.company_name) {
      customer = existingCustomers.find(c => c.company_name?.toLowerCase().trim() === row.company_name?.toLowerCase().trim());
    }

    if (!customer) {
      const identifier = row.org_number ? row.org_number.trim() : row.company_name.toLowerCase().trim();
      if (!processedCompanies.has(identifier)) {
        processedCompanies.add(identifier);
        const portalToken = Math.random().toString(36).substring(2, 18);
        newCustomerDataList.push({
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
      }
    }
  }

  // 2. Insert new customers in batches
  if (newCustomerDataList.length > 0) {
    for (let i = 0; i < newCustomerDataList.length; i += 100) {
      try {
        const batch = newCustomerDataList.slice(i, i + 100);
        const created = await base44.asServiceRole.entities.Customer.bulkCreate(batch);
        created.forEach(c => {
          c.newly_created_in_this_import = true;
          existingCustomers.push(c);
        });
        created_customers += created.length;
      } catch (e) {
        errors.push(`Kunde inte skapa batch med kunder: ${e.message}`);
      }
    }
  }

  // 3. Prepare leads, machines, and customer updates
  const newMachinesData = [];
  const newLeadsData = [];
  const customersToUpdateMap = new Map();
  const processedMachines = new Set();

  for (const row of rows) {
    if (!row.company_name) {
      skipped_rows++;
      continue;
    }

    let customer = null;
    if (row.org_number) {
      customer = existingCustomers.find(c => c.org_number && c.org_number.trim() === row.org_number.trim());
    }
    if (!customer && row.company_name) {
      customer = existingCustomers.find(c => c.company_name?.toLowerCase().trim() === row.company_name?.toLowerCase().trim());
    }

    if (!customer) continue; // Should not happen

    if (!customer.newly_created_in_this_import) {
      skipped_customers++;
    }

    // Lead creation for newly created customers
    if (customer.newly_created_in_this_import) {
      const leadExists = existingLeads.some(l => l.customer_id === customer.id) || newLeadsData.some(l => l.customer_id === customer.id);
      if (!leadExists) {
        const leadData = {
          customer_id: customer.id,
          company_name: customer.company_name,
          org_number: customer.org_number || undefined,
          contact_person: customer.contact_person || undefined,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          status: 'new',
          proposed_machines: [],
        };
        const parsedModel = row.model || row.machine_model;
        if (parsedModel && row.serial_number) {
          leadData.proposed_machines.push({
            model: parsedModel,
            serial_number: row.serial_number,
          });
        }
        newLeadsData.push(leadData);
      }
    }

    // Machine creation
    const parsedModel = row.model || row.machine_model;
    if (parsedModel) {
      const serial = row.serial_number || '';
      const machineExists = existingMachines.some(m => 
        m.customer_id === customer.id && 
        m.model === parsedModel && 
        (serial ? m.serial_number === serial : true)
      );
      
      const machineIdentifier = `${customer.id}-${parsedModel}-${serial}`;
      const machineInBatch = processedMachines.has(machineIdentifier);

      if (machineExists || machineInBatch) {
        skipped_machines++;
      } else {
        newMachinesData.push({
          model: parsedModel,
          serial_number: serial,
          service_date: row.latest_service_date || null,
          customer_id: customer.id,
          status: 'active',
          service_contract: 'none',
        });
        processedMachines.add(machineIdentifier);

        if (!customer.newly_created_in_this_import && !customer.has_added_machine_via_import) {
          customersToUpdateMap.set(customer.id, { id: customer.id, has_added_machine_via_import: true });
          customer.has_added_machine_via_import = true;
        }
      }
    }
  }

  // 4. Execute bulk operations for leads, machines, and customer updates
  if (newLeadsData.length > 0) {
    for (let i = 0; i < newLeadsData.length; i += 100) {
      try {
        await base44.asServiceRole.entities.ServiceContractLead.bulkCreate(newLeadsData.slice(i, i + 100));
      } catch (e) {
        errors.push(`Kunde inte skapa batch med prospekt: ${e.message}`);
      }
    }
  }

  if (newMachinesData.length > 0) {
    for (let i = 0; i < newMachinesData.length; i += 100) {
      try {
        const batch = newMachinesData.slice(i, i + 100);
        await base44.asServiceRole.entities.Machine.bulkCreate(batch);
        created_machines += batch.length;
      } catch (e) {
        errors.push(`Kunde inte skapa batch med maskiner: ${e.message}`);
      }
    }
  }

  const customersToUpdateList = Array.from(customersToUpdateMap.values());
  if (customersToUpdateList.length > 0) {
    for (let i = 0; i < customersToUpdateList.length; i += 100) {
      try {
        await base44.asServiceRole.entities.Customer.bulkUpdate(customersToUpdateList.slice(i, i + 100));
      } catch (e) {
        errors.push(`Kunde inte uppdatera befintliga kunders import-markeringar: ${e.message}`);
      }
    }
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