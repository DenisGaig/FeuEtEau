import fs from "fs/promises";
import { parseBuffer } from "music-metadata";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRIVATE_AUDIO_DIR = join(__dirname, "../../../private/audio");

export async function GET({
  params,
  request,
}: {
  params: { filename: string };
  request: Request;
}) {
  const { filename } = params;

  try {
    // Vérification basique de sécurité pour éviter la traversée de répertoire
    if (filename.includes("..") || !filename.endsWith(".mp3")) {
      return new Response("Fichier non autorisé", { status: 403 });
    }

    // Chemin complet du fichier
    const filePath = join(PRIVATE_AUDIO_DIR, filename);

    // Vérifier si le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      return new Response("Fichier non trouvé", { status: 404 });
    }

    // Lecture du fichier
    const file = await fs.readFile(filePath);
    const metadata = await parseBuffer(file);

    // Envoi de la réponse
    return new Response(file, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Audio-Duration": metadata.format.duration!.toString(),
        // Empêcher la mise en cache du fichier
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier:", error);
    return new Response("Erreur serveur", { status: 500 });
  }
}
