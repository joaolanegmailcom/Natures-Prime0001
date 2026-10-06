export default async function handler(req, res) {
  // Permitir chamadas do frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Responder à verificação CORS do navegador
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "MERCADO_PAGO_ACCESS_TOKEN não configurado na Vercel"
      });
    }

    const { payment_id } = req.query;

    if (!payment_id) {
      return res.status(400).json({
        error: "payment_id é obrigatório"
      });
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Não foi possível consultar o pagamento",
        details: data.message || data.error || "Erro desconhecido"
      });
    }

    return res.status(200).json({
      sucesso: true,
      payment_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      external_reference: data.external_reference,
      transaction_amount: data.transaction_amount,
      payment_method_id: data.payment_method_id,
      date_created: data.date_created,
      date_approved: data.date_approved || null
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao consultar pagamento"
    });
  }
}
