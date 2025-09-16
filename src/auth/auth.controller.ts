// /* eslint-disable prettier/prettier */
// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   Res,
//   HttpStatus,
//   HttpException,
//   Query,
//   BadRequestException,
//   HttpCode,
//   Req,
//   UseInterceptors,
//   UploadedFile,
//   Request,
//   UseGuards,
// } from '@nestjs/common';
// import { AuthService } from './auth.service';
// // import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
// // import { UpdateAuthDto } from './dto/update-auth.dto';
// import { ConfigService } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';
// import type { Response } from 'express';
// import { CreateAuthDto, CreateAuthDtoDriver, LoginAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
// import { User } from './entities/user.entity';
// import { CreateVehicleDto } from './dto/vehicle.dto';
// import { FileInterceptor } from '@nestjs/platform-express';
// import * as path from 'path';
// import { ChangePasswordDto } from './dto/change-password.dto';
// import { JwtGuard } from 'src/guards/jwt.guards';
// import { Users } from 'src/decorators/user.decorator';
// import { plainToInstance } from 'class-transformer';
// import { validate } from 'class-validator';

// @Controller('auth')
// export class AuthController {
//   constructor(
//     private readonly authService: AuthService,
//     private readonly configService: ConfigService,
//     private readonly jwtService: JwtService,
//   ) {}

//   @Post('create')
//   async createUser(
//     @Body() createUserDto: CreateAuthDto,
//     @Res({ passthrough: true }) response: Response,
//   ): Promise<any> {
//     const user = await this.authService.createUser(createUserDto);

//     const payload = { email: user.email, sub: user.id };
//     const rolePayload = { role: user.role, sub: user.id };

//     // Define token expiry times
//     const accessTokenExpiry = '1d';
//     const refreshTokenExpiry = '7d';
//     const roleTokenExpiry = '7d';

//     // Generate tokens
//     const accessToken = await this.jwtService.signAsync(payload, {
//       expiresIn: accessTokenExpiry,
//       secret: this.configService.get<string>('ACCESS_TOKEN'),
//     });

//     const refreshToken = await this.jwtService.signAsync(payload, {
//       expiresIn: refreshTokenExpiry,
//       secret: this.configService.get<string>('REFRESH_TOKEN'),
//     });

//     const roleToken = await this.jwtService.signAsync(rolePayload, {
//       expiresIn: roleTokenExpiry,
//       secret: this.configService.get<string>('ROLE_TOKEN'),
//     });

//     // Return response
//     return response.status(HttpStatus.CREATED).json({
//       statusCode: HttpStatus.CREATED,
//       message: 'User created successfully.',
//       tokens: {
//         accessToken,
//         refreshToken,
//         roleToken,
//       },
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   }

//   @Post('login')
//   async login(
//     @Body() loginAuthDto: LoginAuthDto,
//     @Res({ passthrough: true }) response: Response,
//   ): Promise<any> {
//     try {
//       const { accessToken, refreshToken, user } = await this.authService.login(loginAuthDto);

//       // Set the refresh token as an HTTP-only cookie
//       response.cookie('refreshToken', refreshToken, {
//         httpOnly: true,
//         secure: true, // Set to true in production (requires HTTPS)
//         sameSite: 'strict',
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//       });

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Login successful',
//         accessToken,
//         user,
//       };
//     } catch (error) {
//       throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
//     }
// }

// @Post('logout')
// async logout(@Res({ passthrough: true }) response: Response): Promise<any> {
//   console.log('Before clearing cookies:', response.getHeaders()['set-cookie']);

//   response.cookie('refreshToken', '', {
//     httpOnly: true,
//     secure: true, // Set this based on environment
//     sameSite: 'strict',
//     maxAge: 0
//   });

//   console.log('After clearing cookies:', response.getHeaders()['set-cookie']);

//   return response.status(HttpStatus.OK).json({
//     statusCode: HttpStatus.OK,
//     message: 'Logout successful'
//   });
// }

//  @Get()
//   async findAll(@Res() response: Response) {
//     const users = await this.authService.findAll();
//     return response.status(HttpStatus.OK).json({
//       statusCode: HttpStatus.OK,
//       message: 'Users retrieved successfully.',
//       data: users,
//     });
//   }

//   @Get('count')
//   async countUsers(@Res() response: Response): Promise<any>{
//     const count = await this.authService.countUsers();
//     return response.status(HttpStatus.OK).json({
//       statusCode: HttpStatus.OK,
//       message: 'Total number of users retrieved successfully.',
//       data: { count },
//     });
//   }
  
//   @Get('all')
//   async findAllUsers(
//     @Query('page') page: number,
//     @Query('limit') limit: number,
//     @Query('search') search: string,
//     @Res() response: Response,
//   ) {
//     const result = await this.authService.findAllUsers({ page, limit, search });
//     return response.status(HttpStatus.OK).json({
//       statusCode: HttpStatus.OK,
//       message: 'Users retrieved successfully.',
//       data: result.data,
//       pagination: {
//         total: result.total,
//         page,
//         limit,
//       },
//     });
//   }

//   @Get('brands')
//   async getCarBrands(): Promise<any> {
//     return this.authService.getCarBrands();
//   }
//   @Get('health')
//   healthCheck(): string {
//     return 'OK';
//   }
//   @Get('available_drivers')
//   async getAvailableDrivers() {
//     return this.authService.findAvailableDrivers();
//   }
//   @Get('drivers')
//   async getDrivers() {
//     return this.authService.getDrivers();
//   }
//   @Patch('password')
//   @UseGuards(JwtGuard)
//   async changePassword(
//     @Users('sub') userId: string,
//     @Body() body: any
//   ){
//     return this.authService.changePassword(userId, body.oldPassword, body.newPassword)
//   }
//   @Get(':id')
//   async findOne(@Param('id') id: string, @Res() response: Response) {
//     const user = await this.authService.findOne(id);
//     return response.status(HttpStatus.OK).json({
//       statusCode: HttpStatus.OK,
//       message: 'User retrieved successfully.',
//       data: user,
//     });
//   }

//   @Patch(':id')
//   async update(
//     @Param('id') id: string,
//     @Body() updateAuthDto: UpdateAuthDto,
//     @Res() response: Response,
    
//   ) {
//     const updatedUser = await this.authService.update(id, updateAuthDto);
//     return response.status(HttpStatus.OK).json({
//       statusCode: HttpStatus.OK,
//       message: 'User updated successfully.',
//       data: updatedUser,
//     });
//   }
// // @Patch('change-password')
// //  @UseGuards(JwtGuard)
// // async changePassword(
// //  @Users('sub') userId: string, // Assuming you're using a session or JWT for authentication
// //   @Body() changePasswordDto: ChangePasswordDto,
// // ) {
// //   return changePasswordDto
// //   // const { oldPassword, newPassword } = changePasswordDto;
// //   // return this.authService.changePassword(userId, oldPassword, newPassword);
// // }
// // @Patch('change-password')
// // @UseGuards(JwtGuard)
// // async changePassword(
// //   @Users('sub') userId: string,
// //   @Body() body: any
// // ) {
// //   // const dto = plainToInstance(ChangePasswordDto, body);
// //   // const errors = await validate(dto);
// //   // if (errors.length > 0) {
// //   //   console.log('Validation failed:', errors);
// //   //   throw new BadRequestException(errors);
// //   // }

// //   return body;
// // }


//   @Delete(':id')
//   async remove(@Param('id') id: string, @Res() response: Response) {
//     await this.authService.remove(id);
//     return response.status(HttpStatus.NO_CONTENT).json({
//       statusCode: HttpStatus.NO_CONTENT,
//       message: 'User removed successfully.',
//     });
    
//   } 
//   @Post('create-driver')
//   @HttpCode(HttpStatus.CREATED)
//   async createUserDriver(@Body() createUserDto: CreateAuthDtoDriver): Promise<User> {
//     return this.authService.createUserDriver(createUserDto);
//   }
//   @Post('update-or-create')
//   async updateOrCreateUser(@Body() userData: any) {
//     if (!userData.email) {
//       throw new BadRequestException('Email is required');
//     }
    
//     return await this.authService.updateOrCreateUser(userData);
//   }


 

//   @Get('drivers/:id')
// async getDriverById(@Param('id') id: string) {
//   return this.authService.getDriverById(id);
// }

  
//   @Get('car/:make')
//   async getCarModels(@Param('make') make: string): Promise<any> {
//     return this.authService.getCarModels(make);
//   }

//   // Endpoint to get car model details based on make and model
//   @Get('model/:make/:model')
//   async getCarModelDetails(
//     @Param('make') make: string,
//     @Param('model') model: string,
//   ): Promise<any> {
//     return this.authService.getCarModelDetails(make, model);
//   }

//   @Post('vehicle')
//   async createOrUpdateVehicle(
//     @Query('email') email: string, // Use email instead of CurrentUser
//     @Body() dto: CreateVehicleDto,
//   ) {
//     if (!email) {
//       throw new Error('Email is required');
//     }
//     return this.authService.createOrUpdateVehicle(email, dto);
//   }

//   @Post('user_vehicle')
//   async getVehicleByUser(@Query('email') email: string) {
//     if (!email) {
//       throw new Error('Email is required');

//     }
//     // return email;
//     return this.authService.getVehicleByUser(email);
//   }

//   @Post('profile_img')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       fileFilter: (req, file, callback) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         if (!['.jpeg', '.jpg', '.png', '.gif'].includes(ext)) {
//           return callback(new BadRequestException('Invalid image file format'), false);
//         }
//         callback(null, true);
//       },
//     }),
//   )
//   async createProfileImage(
//     @UploadedFile() file: Express.Multer.File,
//     @Body('email') email: string,
//   ) {
//     if (!file) {
//       throw new BadRequestException('Image file is required');
//     }

   
//     const user = await this.authService.findOneByEmail(email); // Fetch the user from the UserService
//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     // Delegate product creation to the service
//     return this.authService.createProfileImage(file, user);
//   }
//   @Post('plate_num_img')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       fileFilter: (req, file, callback) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         if (!['.jpeg', '.jpg', '.png', '.gif'].includes(ext)) {
//           return callback(new BadRequestException('Invalid image file format'), false);
//         }
//         callback(null, true);
//       },
//     }),
//   )

//   async createPlateNumImage(
//     @UploadedFile() file: Express.Multer.File,
//     @Body('email') email: string,
//   ) {
//     if (!file) {
//       throw new BadRequestException('Image file is required');
//     }

   
//     const user = await this.authService.findOneByEmail(email); // Fetch the user from the UserService
//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     // Delegate product creation to the service
//     return this.authService.createPlateNumImage(file, user);
//   }

//   @Post('vehicle_img')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       fileFilter: (req, file, callback) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         if (!['.jpeg', '.jpg', '.png', '.gif'].includes(ext)) {
//           return callback(new BadRequestException('Invalid image file format'), false);
//         }
//         callback(null, true);
//       },
//     }),
//   )
//   async createVehicleImage(
//     @UploadedFile() file: Express.Multer.File,
//     @Body('email') email: string,
//   ) {
//     if (!file) {
//       throw new BadRequestException('Image file is required');
//     }

   
//     const user = await this.authService.findOneByEmail(email); // Fetch the user from the UserService
//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     // Delegate product creation to the service
//     return this.authService.createVehicleImage(file, user);
//   }

//   @Post('license_img')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       fileFilter: (req, file, callback) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         if (!['.jpeg', '.jpg', '.png', '.gif'].includes(ext)) {
//           return callback(new BadRequestException('Invalid image file format'), false);
//         }
//         callback(null, true);
//       },
//     }),
//   )
//   async createLicenseImage(
//     @UploadedFile() file: Express.Multer.File,
//     @Body('email') email: string,
//   ) {
//     if (!file) {
//       throw new BadRequestException('Image file is required');
//     }

   
//     const user = await this.authService.findOneByEmail(email); // Fetch the user from the UserService
//     if (!user) {
//       throw new BadRequestException('User not found');
//     }

//     // Delegate product creation to the service
//     return this.authService.createLicenseImage(file, user);
//   }

//   @Delete('vehicle')
//   async deleteVehicle(@Query('email') email: string) {
//     if (!email) {
//       throw new Error('Email is required');
//     }
//     return this.authService.deleteVehicle(email);
//   }
// }
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Query,
  BadRequestException,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { CreateAuthDto, CreateAuthDtoDriver, LoginAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';
import { CreateVehicleDto } from './dto/vehicle.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtGuard } from 'src/guards/jwt.guards';
import { Users } from 'src/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // Create user -> set refresh cookie, return access token + safe user; role lives in access token
  @Post('create')
  async createUser(
    @Body() createUserDto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const user = await this.authService.createUser(createUserDto);
    const { accessToken, refreshToken, user: safe } =
      await this.authService.issueTokensForUser(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully.',
      accessToken,
      user: safe,
    };
  }

  @Post('login')
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    try {
      const { accessToken, refreshToken, user } = await this.authService.login(loginAuthDto);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
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
  async logout(@Res({ passthrough: true }) res: Response): Promise<any> {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
    };
  }

  @Get()
  async findAll() {
    const users = await this.authService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully.',
      data: users,
    };
  }

  @Get('count')
  async countUsers(): Promise<any> {
    const count = await this.authService.countUsers();
    return {
      statusCode: HttpStatus.OK,
      message: 'Total number of users retrieved successfully.',
      data: { count },
    };
  }

  @Get('all')
  async findAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    const result = await this.authService.findAllUsers({ page: +page, limit: +limit, search });
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully.',
      data: result.data,
      pagination: {
        total: result.total,
        page: +page,
        limit: +limit,
      },
    };
  }

  @Get('brands')
  async getCarBrands(): Promise<any> {
    return this.authService.getCarBrands();
  }

  @Get('health')
  healthCheck(): string {
    return 'OK';
  }

  @Get('available_drivers')
  async getAvailableDrivers() {
    return this.authService.findAvailableDrivers();
  }

  @Get('drivers')
  async getDrivers() {
    return this.authService.getDrivers();
  }

  @Patch('password')
  @UseGuards(JwtGuard)
  async changePassword(
    @Users('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto.oldPassword, dto.newPassword);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.authService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully.',
      data: user,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAuthDto: UpdateAuthDto,
  ) {
    const updatedUser = await this.authService.update(id, updateAuthDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully.',
      data: updatedUser,
    };
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.authService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User removed successfully.',
    };
  }

  @Post('create-driver')
  @HttpCode(HttpStatus.CREATED)
  async createUserDriver(@Body() createUserDto: CreateAuthDtoDriver): Promise<User> {
    return this.authService.createUserDriver(createUserDto);
  }

  @Post('update-or-create')
  async updateOrCreateUser(@Body() userData: any) {
    if (!userData.email) {
      throw new BadRequestException('Email is required');
    }
    return await this.authService.updateOrCreateUser(userData);
  }

  @Get('drivers/:id')
  async getDriverById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.authService.getDriverById(id);
  }

  @Get('car/:make')
  async getCarModels(@Param('make') make: string): Promise<any> {
    return this.authService.getCarModels(make);
  }

  @Get('model/:make/:model')
  async getCarModelDetails(
    @Param('make') make: string,
    @Param('model') model: string,
  ): Promise<any> {
    return this.authService.getCarModelDetails(make, model);
  }

  // VEHICLE endpoints now use JWT identity, not email
  @Post('vehicle')
  @UseGuards(JwtGuard)
  async createOrUpdateVehicle(
    @Users('sub') userId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.authService.createOrUpdateVehicleByUserId(userId, dto);
  }

  @Get('user_vehicle')
  @UseGuards(JwtGuard)
  async getVehicleByUser(@Users('sub') userId: string) {
    return this.authService.getVehicleByUserId(userId);
  }

  @Delete('vehicle')
  @UseGuards(JwtGuard)
  async deleteVehicle(@Users('sub') userId: string) {
    return this.authService.deleteVehicleByUserId(userId);
  }

  // FILE UPLOADS: add size limits + MIME checks
  private static imageUploadOptions = {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, callback) => {
      const allowed = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowed.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid image MIME type'), false);
      }
      callback(null, true);
    },
  };

  @Post('profile_img')
  @UseInterceptors(FileInterceptor('file', AuthController.imageUploadOptions))
  async createProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string, // (optional: you could also move this to JWT)
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const user = await this.authService.findOneByEmail(email);
    return this.authService.createProfileImage(file, user);
  }

  @Post('plate_num_img')
  @UseInterceptors(FileInterceptor('file', AuthController.imageUploadOptions))
  async createPlateNumImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const user = await this.authService.findOneByEmail(email);
    return this.authService.createPlateNumImage(file, user);
  }

  @Post('vehicle_img')
  @UseInterceptors(FileInterceptor('file', AuthController.imageUploadOptions))
  async createVehicleImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const user = await this.authService.findOneByEmail(email);
    return this.authService.createVehicleImage(file, user);
  }

  @Post('license_img')
  @UseInterceptors(FileInterceptor('file', AuthController.imageUploadOptions))
  async createLicenseImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const user = await this.authService.findOneByEmail(email);
    return this.authService.createLicenseImage(file, user);
  }
}
