import { http } from "@/lib/http";
import type { LoginInput, RegisterInput } from "@/lib/schemas/auth";

export async function signIn(input: LoginInput) {
  await http.post("/session", input);
}

export async function signUp(input: RegisterInput) {
  await http.post("/session/register", input);
}

export async function signOut() {
  await http.delete("/session");
}