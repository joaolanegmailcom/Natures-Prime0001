export default async function handler(req, res) {
  if (req.method !== "POST") {
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

    const {
      valor,
      descricao,
      nome,
      email,
      cpf,
      referencia
    } = req.body;

    if (!valor || !descricao || !nome || !email || !cpf || !referencia) {
      return res.status(400).json({
        error: "Dados obrigatórios não informados"
      });
    }

    const idempotencyKey = crypto.randomUUID();

    const response = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          transaction_amount: Number(valor),
          description: descricao,
          payment_method_id: "pix",
          external_reference: referencia,
          payer: {
            email,
            first_name: nome,
            identification: {
              type: "CPF",
              number: String(cpf).replace(/\D/g, "")
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Mercado Pago recusou a criação do pagamento",
        details: data.message || data.error || "Erro desconhecido"
      });
    }

    return res.status(200).json({
      sucesso: true,
      payment_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      external_reference: data.external_reference,
      qr_code:
        data.point_of_interaction?.transaction_data?.qr_code || null,
      qr_code_base64:
        data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticket_url:
        data.point_of_interaction?.transaction_data?.ticket_url || null
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao criar pagamento PIX"
    });
  }
}
