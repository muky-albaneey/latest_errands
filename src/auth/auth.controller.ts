/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  HttpException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
// import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('create')
  async createUser(
    @Body() createUserDto: CreateAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<any> {
    const user = await this.authService.createUser(createUserDto);

    const payload = { email: user.email, sub: user.id };
    const rolePayload = { role: user.role, sub: user.id };

    // Define token expiry times
    const accessTokenExpiry = '1d';
    const refreshTokenExpiry = '7d';
    const roleTokenExpiry = '7d';

    // Generate tokens
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenExpiry,
      secret: this.configService.get<string>('ACCESS_TOKEN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: refreshTokenExpiry,
      secret: this.configService.get<string>('REFRESH_TOKEN'),
    });

    const roleToken = await this.jwtService.signAsync(rolePayload, {
      expiresIn: roleTokenExpiry,
      secret: this.configService.get<string>('ROLE_TOKEN'),
    });

    // Return response
    return response.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully.',
      tokens: {
        accessToken,
        refreshToken,
        roleToken,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  }

  @Post('login')
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<any> {
    try {
      const { accessToken, refreshToken, user } = await this.authService.login(loginAuthDto);

      // Set the refresh token as an HTTP-only cookie
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // Set to true in production (requires HTTPS)
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        accessToken,
        user,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
 
@Post('logout')
async logout(@Res({ passthrough: true }) response: Response): Promise<any> {
  console.log('Before clearing cookies:', response.getHeaders()['set-cookie']);

  response.cookie('refreshToken', '', {
    httpOnly: true,
    secure: true, // Set this based on environment
    sameSite: 'strict',
    maxAge: 0
  });

  console.log('After clearing cookies:', response.getHeaders()['set-cookie']);

  return response.status(HttpStatus.OK).json({
    statusCode: HttpStatus.OK,
    message: 'Logout successful'
  });
}

  
  @Get()
  async findAll(@Res() response: Response) {
    const users = await this.authService.findAll();
    return response.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully.',
      data: users,
    });
  }
  @Get('count')
  async countUsers(@Res() response: Response): Promise<any> {
    const count = await this.authService.countUsers();
    return response.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Total number of users retrieved successfully.',
      data: { count },
    });
  }
  
  @Get('all')
  async findAllUsers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Res() response: Response,
  ) {
    const result = await this.authService.findAllUsers({ page, limit, search });
    return response.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully.',
      data: result.data,
      pagination: {
        total: result.total,
        page,
        limit,
      },
    });
  }
 
  @Get('health')
  healthCheck(): string {
    return 'OK';
  }


  @Get(':id')
  async findOne(@Param('id') id: string, @Res() response: Response) {
    const user = await this.authService.findOne(id);
    return response.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully.',
      data: user,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAuthDto: UpdateAuthDto,
    @Res() response: Response,
  ) {
    const updatedUser = await this.authService.update(id, updateAuthDto);
    return response.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'User updated successfully.',
      data: updatedUser,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() response: Response) {
    await this.authService.remove(id);
    return response.status(HttpStatus.NO_CONTENT).json({
      statusCode: HttpStatus.NO_CONTENT,
      message: 'User removed successfully.',
    });
    
  } @Post('update-or-create')
  async updateOrCreateUser(@Body() userData: any) {
    if (!userData.email) {
      throw new BadRequestException('Email is required');
    }
    
    return await this.authService.updateOrCreateUser(userData);
  }

  @Get(':make')
  async getCarModels(@Param('make') make: string): Promise<any> {
    return this.authService.getCarModels(make);
  }

  // Endpoint to get car model details based on make and model
  @Get('model/:make/:model')
  async getCarModelDetails(
    @Param('make') make: string,
    @Param('model') model: string,
  ): Promise<any> {
    return this.authService.getCarModelDetails(make, model);
  }

}
