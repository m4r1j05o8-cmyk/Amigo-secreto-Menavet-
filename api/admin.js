
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const { password } = req.body || {};
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
        error: "Contraseña incorrecta"
      });
    }

    const headers = {
      "apikey": secret,
      "Authorization": `Bearer ${secret}`
    };

    const [participantesResp, asignacionesResp] =
      await Promise.all([
        fetch(
          `${url}/rest/v1/participants?select=id,name,wishlist&order=name.asc`,
          { headers }
        ),
        fetch(
          `${url}/rest/v1/assignments?select=giver_id,receiver_id`,
          { headers }
        )
      ]);

    if (!participantesResp.ok || !asignacionesResp.ok) {
      throw new Error("No se pudieron consultar los datos");
    }

    const participantes = await participantesResp.json();
    const asignaciones = await asignacionesResp.json();

    const resultado = participantes.map(persona => {
      const asignacion = asignaciones.find(
        item => item.giver_id === persona.id
      );

      const destinatario = asignacion
        ? participantes.find(
            item => item.id === asignacion.receiver_id
          )
        : null;

      return {
        nombre: persona.name,
        lista_deseos: persona.wishlist || "",
        destinatario: destinatario
          ? destinatario.name
          : "Sin asignar"
      };
    });

    return res.status(200).json({
      participantes: resultado
    });

  } catch (error) {
    console.error("Error en administración:", error);

    return res.status(500).json({
      error: "No se pudo cargar el panel"
    });
  }
};
