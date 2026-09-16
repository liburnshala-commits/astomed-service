export default async function createAcademyLead(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const data = req.body;
  if (!data.email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Skapa en ny förfrågan i PublicServiceLead
    const lead = await base44.asServiceRole.entities.PublicServiceLead.create({
      company_name: data.company_name || data.contact_person || 'Ansökan från Academy',
      contact_person: data.contact_person || 'Okänd',
      email: data.email,
      phone: data.phone || 'Okänd',
      org_number: data.org_number || '',
      machine_name: 'Astomed Academy',
      service_description: 'Ansökan om konto/tillgång till Astomed Academy.\n\n' + (data.notes || ''),
      service_type: 'standard',
      status: 'new'
    });

    // Skicka en intern notis
    try {
      await base44.asServiceRole.functions.invoke("createNotification", {
        user_email: "admin@serviceastomed.se", 
        title: "Ny Academy-ansökan",
        message: `Ny ansökan mottagen från Academy: ${lead.company_name}.`,
        type: "info",
        related_entity: "PublicServiceLead",
        related_entity_id: lead.id
      });
    } catch(e) {
      console.error("Could not send notification", e);
    }

    return res.json({ success: true, lead });
  } catch (error) {
    console.error("Error creating academy lead:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}