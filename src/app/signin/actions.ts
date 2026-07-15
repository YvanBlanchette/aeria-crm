"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function signin(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Courriel et mot de passe requis." };

  let user: {
    id: string;
    passwordHash: string;
  } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
  } catch {
    return { error: "Le service de connexion est temporairement indisponible." };
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Identifiants invalides." };
  }

  try {
    await createSession(user.id);
  } catch {
    return { error: "Connexion impossible pour le moment. Reessayez." };
  }

  redirect("/dashboard");
}
