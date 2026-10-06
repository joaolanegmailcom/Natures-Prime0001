export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      erro: "Método não permitido"
    });
  }

  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      return res.status(500).json({
        sucesso: false,
        erro: "GOOGLE_SHEETS_WEBHOOK_URL não configurado na Vercel"
      });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();

    return res.status(response.ok ? 200 : 500).json({
      sucesso: response.ok,
      resposta: data
    });

  } catch (error) {
    return res.status(500).json({
      sucesso: false,
      erro: "Erro ao enviar dados para o Google Planilhas"
    });
  }
}
