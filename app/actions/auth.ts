'use server'

import { getUser, createUser } from "@/db"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"
import { compare } from "bcrypt-ts"
import console from "console"

export async function signup(prevState: { error: string }, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm-password") as string

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." }
  }

  try {
    const existingUser = await getUser(email)
    if (existingUser.length > 0) {
      return { error: "이미 존재하는 이메일입니다." }
    }

    await createUser(email, password)
  } catch (err) {
    console.error(err)
    return { error: "회원가입 중 오류가 발생했습니다." }
  }

  redirect("/login")
}

export async function login(
  state: { error: string, success: boolean } | undefined,
  formData: FormData
): Promise<{ error: string, success: boolean } | undefined> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const user = await getUser(email)

  if (user.length === 0) {
    return { success: false, error: "이메일 또는 비밀번호가 일치하지 않습니다." }
  }

  const passwordsMatch = await compare(password, user[0].password!)
  if (!passwordsMatch) {
    return { success: false, error: "이메일 또는 비밀번호가 일치하지 않습니다." }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: '/',
    })
  } catch (err) {
    console.error(err)
    throw err
  }
}

export async function signInWithGoogle() {
  try {
    await signIn("google", {
      redirectTo: '/',
      redirect: true,
      callbackUrl: '/'
    })
  } catch (err) {
    console.error(err)
    throw err
  }
} 