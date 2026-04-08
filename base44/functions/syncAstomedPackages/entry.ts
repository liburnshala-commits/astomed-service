import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const prompt = `Gå till https://astomedshop.se/pages/utbildningar och hämta de senaste utbildningarna och kurserna. 
Extrahera namn, beskrivning, pris (som ett nummer) och URL till varje specifik kurs.
Returnera ett JSON-objekt med en array 'packages' som innehåller dessa utbildningar.`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: true,
            model: 'gemini_3_1_pro', // Model that supports web search
            response_json_schema: {
                type: "object",
                properties: {
                    packages: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" },
                                price: { type: "number" },
                                url: { type: "string" }
                            },
                            required: ["name", "price", "url"]
                        }
                    }
                }
            }
        });

        let addedCount = 0;

        if (result && result.packages) {
            const existingPackages = await base44.asServiceRole.entities.Product.filter({ category: "Paket" });
            
            for (const pkg of result.packages) {
                const exists = existingPackages.find(ep => ep.name.toLowerCase() === pkg.name.toLowerCase());
                
                if (!exists) {
                    await base44.asServiceRole.entities.Product.create({
                        name: pkg.name,
                        description: pkg.description || "Utbildningspaket från Astomed",
                        category: "Paket",
                        suggested_retail_price: pkg.price || 0,
                        cost_price: 0,
                        education_url: pkg.url.startsWith('http') ? pkg.url : `https://astomedshop.se${pkg.url}`,
                        is_package: true,
                        related_machine_models: ["Alla"]
                    });
                    addedCount++;
                }
            }
        }

        return Response.json({ success: true, processed: result?.packages?.length || 0, added: addedCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});