export default async function createProspect(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const data = req.body;
  if (!data.email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Kontrollera om prospektet redan finns
  const existingLead = await base44.asServiceRole.entities.ServiceContractLead.filter({ email: data.email });
  if (existingLead.length > 0) {
    return res.json({ success: true, message: 'Prospect already exists', lead: existingLead[0] });
  }

  // Skapa nytt prospekt
  const lead = await base44.asServiceRole.entities.ServiceContractLead.create({
    company_name: data.company_name || data.contact_person || 'Nytt Prospekt från Academy',
    contact_person: data.contact_person || '',
    email: data.email,
    phone: data.phone || '',
    org_number: data.org_number || '',
    status: 'new',
    notes: data.notes ? `Från Astomed Academy: ${data.notes}` : 'Skapad via integration från Astomed Academy.'
  });

  // Skicka en intern notis
  try {
    await base44.asServiceRole.functions.invoke("createNotification", {
      user_email: "admin@serviceastomed.se", 
      title: "Nytt prospekt (Academy)",
      message: `Nytt prospekt mottaget från Academy: ${lead.company_name}.`,
      type: "info",
      related_entity: "ServiceContractLead",
      related_entity_id: lead.id
    });
  } catch(e) {
    console.error("Could not send notification", e);
  }

  return res.json({ success: true, lead });
}