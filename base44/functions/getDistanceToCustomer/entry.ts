import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { customerAddress } = await req.json();

        if (!customerAddress || customerAddress.length < 3) {
            return Response.json({ error: 'customerAddress is required' }, { status: 400 });
        }

        const prompt = `Calculate the driving distance in kilometers from Kungens Kurva, Stockholm, Sweden to the following address: ${customerAddress}. Return the driving distance as an integer.`;
        
        const response_json_schema = {
            type: "object",
            properties: {
                distance_km: { type: "integer" }
            },
            required: ["distance_km"],
            additionalProperties: false
        };

        const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false,
            response_json_schema: response_json_schema,
            model: "automatic"
        });

        if (llmResponse && llmResponse.distance_km !== undefined) {
            return Response.json({ distance_km: llmResponse.distance_km });
        } else {
            return Response.json({ error: 'Could not calculate distance' }, { status: 500 });
        }

    } catch (error) {
        console.error("Error in getDistanceToCustomer:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});