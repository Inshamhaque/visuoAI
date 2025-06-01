import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
const client = new PrismaClient();
// export async function signin() {
//   const { userm };
// }
export async function signup(req: Request, res: Response) {
  const { firstname, lastname, email, password } = req.body;
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const existingUser = await client.user.findUnique({
      where: { mail: email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await client.user.create({
      data: {
        firstName: firstname,
        lastName: lastname,
        mail: email,
        password: hashedPassword,
      },
    });
    return res.status(201).json(user);
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function signin(req: Request, res: Response) {
  const { mail, password } = req.body;
  if (!mail || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await client.user.findUnique({
      where: { mail: mail },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
