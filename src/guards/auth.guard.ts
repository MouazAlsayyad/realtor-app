import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express";

import * as jwt from "jsonwebtoken"
import { PrismaService } from "src/prisma/prisma.service";

interface JWTPayload {
  name:string;
  id:number;
  iat:number;
  exp:number;
}


@Injectable()
export class AuthGuard implements CanActivate{

  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector:Reflector,
    private readonly prisma:PrismaService
    ){}

  async canActivate(context:ExecutionContext){
    const roles = this.reflector.getAllAndOverride('roles',[
      context.getHandler(),
      context.getClass()
    ])

    if(roles?.length){
      const request: Request = context.switchToHttp().getRequest()
      const token = request?.headers?.authorization?.split('Bearer ')[1];
      try{
        const payload =  jwt.verify(token,process.env.JSON_TOKEN_KEY) as JWTPayload
        const user = await this.prisma.user.findUnique({
          where:{
            id:payload.id
          }
        })

        if(!user) return false

        if(roles.includes(user.user_type)) return true
        
        return false 
      } catch(error) {
        this.logger.error(error)
        return false
      }
    }
    
    return true
  }
}