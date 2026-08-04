/**
 * Photography credits for contributor portraits sourced from Wikimedia
 * Commons. Every entry carries the license metadata exactly as the Commons
 * API returned it, the person was confirmed by eye against the reference
 * image, and the source URL is the file page the API reported. Rendered on
 * the contributor's profile and aggregated on /credits.
 *
 * Photos NOT listed here were collected earlier from public appearances;
 * they are progressively being replaced with licensed Commons images.
 */

export interface PhotoCredit {
  /** Contributor id (matches aiContributors and /photos/<id>.jpg). */
  id: string;
  /** Photographer or uploading author as Commons records them. */
  author: string;
  license: string;
  /** The Commons file page for the original. */
  source: string;
}

export const photoCredits: PhotoCredit[] = [
  { id: "sutskever", author: "Eladkarmel", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/w/index.php?curid=132711987" },
  { id: "hinton", author: "Cmichel67", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/w/index.php?curid=191931397" },
  { id: "lecun", author: "Jérémy Barande", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/w/index.php?curid=153264560" },
  { id: "marcus", author: "Web Summit", license: "CC BY 2.0", source: "https://commons.wikimedia.org/w/index.php?curid=125101534" },
  { id: "li", author: "ITU Pictures", license: "CC BY 2.0", source: "https://commons.wikimedia.org/w/index.php?curid=69625478" },
  { id: "dario-amodei", author: "TechCrunch", license: "CC BY 2.0", source: "https://commons.wikimedia.org/w/index.php?curid=185801188" },
  { id: "dean", author: "Cmichel67", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/w/index.php?curid=173226834" },
  { id: "gomez", author: "Gabriel Hutchinson", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/w/index.php?curid=175756687" },
  { id: "pichai", author: "Photographer: Lukasz Kobus (European Commission)", license: "CC BY 4.0", source: "https://commons.wikimedia.org/w/index.php?curid=146301836" },
];

export const photoCreditFor = (id: string): PhotoCredit | undefined =>
  photoCredits.find((c) => c.id === id);
