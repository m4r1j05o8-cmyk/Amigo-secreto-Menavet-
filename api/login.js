
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const { name, pin } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof pin !== "string" ||
      !name.trim() ||
      !pin.trim() ||
      name.length > 100 ||
      pin.length > 30
    ) {
      return res.status(400).json({
        error: "Revisá el nombre y el PIN"
      });
    }

    const url = process.env.SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secret) {
      throw new Error("Configuración incompleta");
    }

    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/rpc/consultar_sorteo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": secret
        },
        body: JSON.stringify({
          p_nombre: name.trim(),
          p_pin: pin.trim()
        })
      }
    );

    if (!response.ok) {
      throw new Error("Error consultando el sorteo");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.status(401).json({
        error: "Datos incorrectos o sorteo pendiente"
      });
    }

    return res.status(200).json({
      destinatario: data[0].destinatario,
      lista_deseos: data[0].lista_deseos
    });

  } catch (error) {
    return res.status(500).json({
      error: "No se pudo consultar el sorteo"
    });
  }
};
