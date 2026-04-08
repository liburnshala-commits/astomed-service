import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const prompt = `Gå till följande webbplatser:
1. https://astomed.se/
2. https://klinikutrustning.se/
3. https://astomedshop.se/
4. https://astomed.se/service/
5. https://astomedshop.se/pages/utbildningar

Hämta de mest aktuella och populära produkterna, utbildningarna, serviceavtalen och tillbehören.
Kategorisera varje sak som antingen 'Paket' (för utbildningar och kombinationer) eller 'Kringprodukt' (för hudvård, tillbehör, service och förbrukningsmaterial).
Extrahera namn, beskrivning, pris (som ett nummer, ange 0 om inget pris finns) och URL till respektive sida.
Returnera ett JSON-objekt med en array 'items' som innehåller dessa produkter.`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: true,
            model: 'gemini_3_1_pro',
            response_json_schema: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" },
                                category: { type: "string", enum: ["Paket", "Kringprodukt"] },
                                price: { type: "number" },
                                url: { type: "string" }
                            },
                            required: ["name", "category", "price", "url"]
                        }
                    }
                }
            }
        });

        let addedCount = 0;

        if (result && result.items) {
            const existingProducts = await base44.asServiceRole.entities.Product.filter({});
            
            for (const item of result.items) {
                const exists = existingProducts.find(ep => ep.name.toLowerCase() === item.name.toLowerCase());
                
                if (!exists) {
                    await base44.asServiceRole.entities.Product.create({
                        name: item.name,
                        description: item.description || "Rekommenderat från Astomed",
                        category: item.category,
                        suggested_retail_price: item.price || 0,
                        cost_price: 0,
                        education_url: item.url.startsWith('http') ? item.url : `https://${item.url}`,
                        is_package: item.category === "Paket",
                        related_machine_models: ["Alla"]
                    });
                    addedCount++;
                }
            }
        }

        return Response.json({ success: true, processed: result?.items?.length || 0, added: addedCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});