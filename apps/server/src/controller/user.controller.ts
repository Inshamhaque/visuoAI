import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth";
const client = new PrismaClient();

export async function signup(req: Request, res: Response) {
  const { firstname, lastname, email, password } = req.body;
  if (!firstname || !lastname || !email || !password) {
    return res.json({ error: "All fields are required",status:411 });
  }
  try {
    const existingUser = await client.user.findUnique({
      where: { mail: email },
    });
    if (existingUser) {
      return res.json({ error: "User already exists",status:400 });
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
    // generate JWT token
    const token = jwt.sign({ userId: user.id }, "JWT_SECRET");
    res.cookie('token',token,{
      httpOnly : true, 
      sameSite:"lax",
      secure:false,// todo: make it true while deploying
      maxAge: 7*24*60*60*1000
    })
    return res.json({
      user,
      token,
      message: "User created successfully",
      status:201
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return res.json({ error: "Internal server error",status:500});
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
      return res.json({ error: "User not found",status:404});
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ error: "Invalid password" ,status:401});
    }
    // generate jwt token here
    const token = jwt.sign({ userId: user.id }, "JWT_SECRET");
    res.cookie('token',token,{
      httpOnly : true, 
      sameSite:"none",
      secure:true,
      maxAge: 7*24*60*60*1000
    })
    return res.json({
      user,
      token,
      message: "Signin successful",
      status:200
    });
  } catch (error) {
    console.error("Error during signin:", error);
    return res.json({ error: "Internal server error", status:500});
  }
}
export async function getProjects(req:AuthRequest, res:Response){
    const { userId } = req.user;
    try{
      const projs = await client.project.findMany({
        where:{
          userId
        }
      })
      if(!projs){
        return res.json({
          message : "No projects found",
          status:411
        })
      }
      return res.json({
        message : "prjects fetched successfully",
        projects:projs,
        status:200
      })
    }
    catch(e){
      res.json({
        message : "some error occurred",
        status:500
      })
      console.error(e);
    }
}