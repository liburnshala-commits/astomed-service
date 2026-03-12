import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, role, inviterName } = await req.json();

    if (!email || !role) {
      return Response.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Map custom roles to Base44 allowed roles (only "user" or "admin")
    const base44Role = role === 'admin' ? 'admin' : 'user';
    
    // Invite user through Base44
    await base44.users.inviteUser(email, base44Role);
    
    // If the intended role is custom (technician/customer), update it immediately
    if (role !== 'admin' && role !== 'user') {
      // Find the newly invited user and update their role
      const allUsers = await base44.asServiceRole.entities.User.list();
      const invitedUser = allUsers.find(u => u.email === email);
      
      if (invitedUser) {
        await base44.asServiceRole.entities.User.update(invitedUser.id, { role });
      }
    }

    // Determine role name in Swedish
    const roleNameSv = role === 'technician' ? 'Service Tekniker' : 
                       role === 'customer' ? 'Kund' : 
                       role === 'admin' ? 'Administratör' : role;

    // Get app URL for password reset link
    const appUrl = Deno.env.get('APP_URL') || 'https://serviceastomed.se';
    const inviterDisplayName = inviterName || user.full_name || user.email;

    // Send custom branded welcome email in Swedish
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1b3a3a; background: #f4f6f4; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 0 auto; padding: 24px; }
    .header { background: #1b3a3a; color: white; padding: 32px 28px; border-radius: 10px 10px 0 0; text-align: center; }
    .logo-text { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .header-subtitle { font-size: 14px; color: #7aadad; }
    .content { background: white; padding: 32px; border-left: 1px solid #dce8e8; border-right: 1px solid #dce8e8; }
    .welcome-box { background: #e8f2f2; border-left: 4px solid #3a9e9e; padding: 20px; border-radius: 6px; margin: 24px 0; }
    .welcome-box h2 { margin: 0 0 12px 0; color: #1b3a3a; font-size: 18px; }
    .welcome-box p { margin: 0; color: #254f4f; line-height: 1.6; }
    .cta-btn { display: inline-block; background: #3a9e9e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .cta-btn:hover { background: #2d7d7d; }
    .instructions { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .instructions h3 { margin: 0 0 8px 0; color: #92400e; font-size: 15px; }
    .instructions ol { margin: 8px 0; padding-left: 20px; color: #92400e; }
    .instructions li { margin: 6px 0; }
    .footer { background: #f0f5f5; padding: 24px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 13px; color: #6b8f8f; line-height: 1.8; }
    p { margin: 0 0 16px 0; line-height: 1.6; }
    .role-badge { display: inline-block; background: #1b3a3a; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Astomed Service</div>
      <div class="header-subtitle">Servicehantering</div>
    </div>
    <div class="content">
      <p>Hej,</p>
      
      <div class="welcome-box">
        <h2>Välkommen till Astomed Service 🎉</h2>
        <p><strong>${inviterDisplayName}</strong> har bjudit in dig att gå med i Astomed Service som <span class="role-badge">${roleNameSv}</span>.</p>
      </div>

      <p><strong>Om Astomed Service:</strong></p>
      <p>Ett heltäckande system för att hantera serviceärenden på maskiner. Spåra all servicehistorik, kundinformation, maskindetaljer och betalningar. Generera professionella servicerapporter med uppladdade bilder och annan dokumentation.</p>

      <div class="instructions">
        <h3>📋 Så här kommer du igång:</h3>
        <p style="margin: 12px 0; color: #92400e; line-height: 1.6;">
          När du loggar in för första gången klickar du på knappen <strong>"Access App"</strong> här nedan. 
          Därefter, när du kommer till inloggningssidan klickar du på <strong>"Glömt Lösenord"</strong> 
          så får du välja ett nytt lösenord i nästa steg.
        </p>
      </div>

      <center>
        <a href="${appUrl}" class="cta-btn">Access App →</a>
      </center>

      <p style="margin-top: 24px;">Har du frågor? Kontakta oss på <a href="mailto:liburn@astomed.se" style="color: #3a9e9e; text-decoration: none;">liburn@astomed.se</a> eller ring <strong>08 – 410 779 00</strong>.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>Astomed Klinikutrustning Sverige AB</strong><br>
      Jägerhorns väg 3-5, 141 75 Kungens Kurva<br>
      <a href="mailto:info@astomed.se" style="color: #3a9e9e; text-decoration: none;">info@astomed.se</a> • <a href="tel:08410779​00" style="color: #3a9e9e; text-decoration: none;">08 – 410 779 00</a></p>
    </div>
  </div>
</body>
</html>`;

    // Send the custom welcome email
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Välkommen till Astomed Service - ${roleNameSv}`,
        body: emailHtml,
        from_name: "Astomed Service"
      });
    } catch (emailError) {
      console.error('Failed to send custom welcome email:', emailError);
      // Continue anyway since Base44 will send its own invitation email
    }

    return Response.json({ 
      success: true, 
      message: `User ${email} invited as ${role}. Welcome email sent.` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});