import { redirect } from "next/navigation";

// The root route only redirects, so it has no static shell to validate.
export const instant = false;

export default function Home() {
  redirect("/dashboard");
}
