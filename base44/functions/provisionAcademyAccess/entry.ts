export default async function provisionAcademyAccess(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { customer_id } = req.body;
  
  if (!customer_id) return res.status(400).json({ error: 'customer_id required' });

  const customer = await base44.asServiceRole.entities.Customer.get(customer_id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  
  const apiUrl = process.env.ACADEMY_APP_URL || 'https://astomedacademy.base44.app';
  const apiKey = process.env.ACADEMY_API_KEY;

  if (apiKey) {
    try {
      const resp = await fetch(`${apiUrl}/api/v1/functions/inviteUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ email: customer.email, role: 'user' })
      });
      if (!resp.ok) {
        console.error("Failed to invite to academy:", await resp.text());
      }
    } catch(e) {
      console.error("Fetch error calling Academy API:", e);
    }
  } else {
    console.warn("ACADEMY_API_KEY not set. Skipping real API call to academy app.");
  }

  // Update customer
  await base44.asServiceRole.entities.Customer.update(customer.id, {
    academy_access_granted: true,
    academy_synced_at: new Date().toISOString()
  });

  // Send confirmation email
  if (customer.email) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: customer.email,
        subject: "Tillgång beviljad: Astomed Academy",
        text: `Hej ${customer.contact_person || ''},\n\nDin begäran om tillgång till Astomed Academy har beviljats. Du kommer att få en inbjudan inom kort.\n\nVänliga hälsningar,\nAstomed-teamet`
      });
    } catch(e) {}
  }

  try {
    await base44.asServiceRole.functions.invoke("logAuditEntry", {
      action: "ACADEMY_PROVISIONED",
      entity_name: "Customer",
      entity_id: customer.id,
      details: "Academy access provisioned manually."
    });
  } catch(e) {}

  return res.json({ success: true });
}