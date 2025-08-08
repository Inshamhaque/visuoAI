import { Request, Response } from "express"
import { AuthRequest } from "../middlewares/auth"
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function getProjects(req:AuthRequest, res:Response){
    const userId = req.user;
    try{
        const result = await prisma.user.findUnique({
            where : {
                id : userId
            },
            include : {
                projects : true
            }
        })
        if(!result){
            return res.json({
                message : "no project found",
                status : 411
            })
        }
        return res.json({
            message : "projects fetched successfully",
            projects : result,
            status : 200
        })
        
    }
    catch(e){
        return res.json({
            message : "error fetching the projects"
        })
    }
}