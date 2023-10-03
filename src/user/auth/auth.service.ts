import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from "bcryptjs"
import * as jwt from "jsonwebtoken"
import { UserType,User } from '@prisma/client';

interface SignupParams {
  email: string;
  password:string;
  phone:string;
  name:string;
}

interface SigninParams {
  email: string;
  password:string;
}

const signToken = async (user:User)=>{
  return await jwt.sign({
    name:user.name,
    id: user.id
  },process.env.JSON_TOKEN_KEY,{
    expiresIn:process.env.JSON_TOKEN_EXPIRERS_IN
  })
  
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma:PrismaService){}
  
  async signup({email,password,name,phone}:SignupParams,userType:UserType){
    const userExists = await this.prisma.user.findUnique({
      where: {
        email
      }
    })

    if(userExists){
      throw new ConflictException('email already exists')
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const user = await this.prisma.user.create({
      data:{
        email,
        name,
        password:hashedPassword,
        phone,
        user_type: userType
      }
    })

    const token = await signToken(user)
    user.password = undefined
    return {user,token}
  }

  async signin({email,password}: SigninParams){
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    })

    if(!user||!(await bcrypt.compare(password,user.password))){
      throw new HttpException('Invalid credentials',400)
    }

    const token = await signToken(user)

    user.password = undefined
    return {user,token}

  }
  generateProductKet(email:string,userType:UserType){
    const string  =`${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`

    return bcrypt.hash(string,10)
  }

}

