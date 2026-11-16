
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const { password, name } = req.body || {};

    const adminPassword = process.env.ADMIN_PASSWORD;
    const url = process.env.SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!adminPassword || !url || !secret) {
      return res.status(500).json({
        error: "Configuración incompleta"
      });
    }

    if (
      typeof password !== "string" ||
      password !== adminPassword
    ) {
      return res.status(401).json({
        error: "Acceso no autorizado"
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100
    ) {
      return res.status(400).json({
        error: "Seleccioná un participante válido"
      });
    }

    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/rpc/cambiar_asignacion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": secret,
          "Authorization": `Bearer ${secret}`
        },
        body: JSON.stringify({
          p_nombre: name.trim()
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        "Error Supabase cambiar asignacion:",
        response.status,
        detail
      );

      return res.status(500).json({
        error: "No se pudo cambiar la asignación"
      });
    }

    const raw = await response.json();
    const data = Array.isArray(raw) ? raw[0] : raw;

    if (!data || data.success !== true) {
      return res.status(400).json({
        error: data?.error || "No se pudo cambiar la asignación"
      });
    }

    return res.status(200).json({
      mensaje: "Asignación cambiada correctamente",
      resultado: data
    });

  } catch (error) {
    console.error("Error cambiando asignación:", error);

    return res.status(500).json({
      error: "No se pudo cambiar la asignación"
    });
  }
};
