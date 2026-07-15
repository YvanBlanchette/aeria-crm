"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function signup(_prev: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Tous les champs sont requis." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  let userId = "";
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Un compte existe deja avec ce courriel." };
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "AGENT",
        passwordHash: await bcrypt.hash(password, 10),
      },
      select: { id: true },
    });

    userId = user.id;
  } catch {
    return { error: "Le service d'inscription est temporairement indisponible." };
  }

  try {
    await createSession(userId);
  } catch {
    return { error: "Compte cree, mais la session n'a pas pu etre ouverte. Connectez-vous." };
  }

  redirect("/dashboard");
}
