import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('AuthService');

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log('---> MongoDB Database Connected <----');
  }

  // TODO: FUNCION QUE USAREMOS PARA CREAR O FIRMAR EL TOKEN Y SU PAYLOAD
  async signJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  // TODO: REGISTRO DE USUARIO
  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, name } = registerUserDto;

    try {
      const userExist = await this.user.findUnique({
        where: {
          email: email,
        },
      });

      if (userExist) {
        return new RpcException({
          message: 'El usuario ya existe',
          status: 400,
        });
      }

      const user = await this.user.create({
        data: {
          email: email,
          password: await bcrypt.hashSync(password, 10),
          name: name,
        },
      });

      console.log('user', user);

      // TODO: NO DEVOLVER EL PASWORD
      // para no devolver el password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: ___, ...rest } = user;

      return {
        user: rest,

        // TODO: EN EL REGSITRO MANDAMOS UN TOKEN TAMBIEN PARA QUE EL USUARIO
        // NO TENGA QUE LOGUEARSE DESPUES DE REGISTRARSE
        // EN ESTE CASO LO QUE PIDE EL TOKEN ES JUSTAMENTE LO QUE CONTIENE EL REST
        // POR LO QUE HACEN MACH Y NO DAN PRPBLEMA
        // ID, EMAIL, NAME
        token: await this.signJwt(rest),
      };
    } catch (error) {
      throw new RpcException({
        message: error.message,
        status: 400,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        return new RpcException({
          message: 'El usuario no existe',
          status: 400,
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return new RpcException({
          message: 'Contraseña incorrecta',
          status: 400,
        });
      }

      console.log('user', user);

      // TODO: NO DEVOLVER EL PASWORD
      // para no devolver el password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: ___, ...rest } = user;

      return {
        user: rest,
        token: await this.signJwt(rest),
      };
    } catch (error) {
      throw new RpcException({
        message: error.message,
        status: 400,
      });
    }
  }

  // TODO: ESTE VERIFYTOKEN LO USARA EL GUARD PARA VERIFICAR EL TOKEN
  async verifyToken(token: string) {
    try {
      // TODO: VERIFICACION DE TOKEN
      // SI NO TIENE LA FIRMA NO ES UN TOKEN VERIDICO
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sub, iat, exp, ...user } = await this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        user: user,
        // enviamos el token para que el usuario no tenga que loguearse de nuevo
        token: await this.signJwt(user),
      };
    } catch (error) {
      throw new RpcException({
        message: 'Invalid token',
        status: 400,
      });
    }
  }
}
