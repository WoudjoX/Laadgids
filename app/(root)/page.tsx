import { permanentRedirect } from "next/navigation";

// Geen Accept-Language-redirect (CLAUDE.md §7): de root gaat altijd naar nl-be.
export default function Root() {
  permanentRedirect("/nl-be");
}
