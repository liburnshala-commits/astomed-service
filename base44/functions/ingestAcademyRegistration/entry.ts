export default async function ingestAcademyRegistration(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const data = req.body;
  
  if (!data.email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Match customer
  let customer = null;
  const byEmail = await base44.asServiceRole.entities.Customer.filter({ email: data.email });
  if (byEmail.length > 0) {
    customer = byEmail[0];
  } else if (data.org_number) {
    const byOrg = await base44.asServiceRole.entities.Customer.filter({ org_number: data.org_number });
    if (byOrg.length > 0) {
      customer = byOrg[0];
    }
  }

  if (customer) {
    // Update existing customer
    await base44.asServiceRole.entities.Customer.update(customer.id, {
      academy_access_granted: false,
      academy_tier: data.tier || 'standard',
      academy_synced_at: new Date().toISOString()
    });
    
    try {
      await base44.asServiceRole.functions.invoke("logAuditEntry", {
        action: "ACADEMY_REQUEST",
        entity_name: "Customer",
        entity_id: customer.id,
        details: "Academy access requested via astomedacademy.se"
      });
    } catch(e) {}

    try {
      await base44.asServiceRole.functions.invoke("createNotification", {
        user_email: "admin@serviceastomed.se",
        title: "Ny Academy-begäran",
        message: `Kunden ${customer.company_name} har begärt tillgång till Astomed Academy.`,
        type: "info",
        related_entity: "Customer",
        related_entity_id: customer.id
      });
    } catch(e) {}

  } else {
    // No match -> Create ServiceContractLead
    const checkLead = await base44.asServiceRole.entities.ServiceContractLead.filter({ email: data.email, status: 'new' });
    if (checkLead.length === 0) {
      const lead = await base44.asServiceRole.entities.ServiceContractLead.create({
        company_name: data.company_name || data.contact_person || 'Astomed Academy Begäran',
        contact_person: data.contact_person || '',
        email: data.email,
        phone: data.phone || '',
        org_number: data.org_number || '',
        status: 'new',
        notes: `Källa: Astomed Academy registrering.\nBegär tillgång till portalen.`
      });

      try {
        await base44.asServiceRole.functions.invoke("createNotification", {
          user_email: "admin@serviceastomed.se", 
          title: "Ny Academy-begäran (Lead)",
          message: `Ny lead från Academy: ${lead.company_name}.`,
          type: "info",
          related_entity: "ServiceContractLead",
          related_entity_id: lead.id
        });
      } catch(e) {}
    }
  }

  return res.json({ success: true });
}