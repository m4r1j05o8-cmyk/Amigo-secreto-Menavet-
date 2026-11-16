
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
      console.error("Falta configuración de Supabase");
      return res.status(500).json({
        error: "Configuración incompleta"
      });
    }

    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/rpc/consultar_sorteo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": secret,
          "Authorization": `Bearer ${secret}`
        },
        body: JSON.stringify({
          p_nombre: name.trim(),
          p_pin: pin.trim()
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("Error de Supabase:", response.status, detail);

      return res.status(500).json({
        error: "No se pudo consultar el sorteo"
      });
    }

    const data = await response.json();
    const resultado = Array.isArray(data) ? data[0] : data;

    if (!resultado || !resultado.destinatario) {
      return res.status(401).json({
        error: "Datos incorrectos o sorteo pendiente"
      });
    }

    return res.status(200).json({
      destinatario: resultado.destinatario,
      lista_deseos: resultado.lista_deseos
    });

  } catch (error) {
    console.error("Error de inicio de sesión:", error);

    return res.status(500).json({
      error: "No se pudo consultar el sorteo"
    });
  }
};
