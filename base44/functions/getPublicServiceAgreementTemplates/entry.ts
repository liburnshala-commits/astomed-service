import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

export default async function(req: Request): Promise<Response> {
  if (req.method !== "POST" && req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    // Use asServiceRole to allow fetching even if the user is unauthenticated
    const templates = await base44.asServiceRole.entities.ServiceAgreementTemplate.list();
    return Response.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}