export const TOOLS = {
    searchProperties: {
        type: "function",
        function: {
            name: "searchProperties",
            description: "Buscar imóveis disponíveis. Use quando o usuário perguntar por casas, apartamentos, aluguel, venda, etc.",
            parameters: {
                type: "object",
                properties: {
                    city: { type: "string" },
                    type: { type: "string", enum: ["APARTMENT", "HOUSE", "LAND"] },
                    maxPrice: { type: "string", description: "Max price in numbers (e.g. '500000')" },
                    bedrooms: { type: "string", description: "Number of bedrooms (e.g. '3')" }
                }
            }
        }
    }
};
