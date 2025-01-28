
/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Like, Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';
// import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { User, UserRole } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { DiverLicense } from './entities/license.entity';
import { Nin } from './entities/drive.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DiverLicense)
    private licenseRepository: Repository<DiverLicense>,
    @InjectRepository(Nin)
    private ninRepository: Repository<Nin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  async createUser(createUserDto: CreateAuthDto): Promise<User> {
    const { email, phoneNumber, password, fname, lname, role } = createUserDto;

    // Check if email or phone number already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phoneNumber }]
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email or phone number already exists.',
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const user = this.userRepository.create({
      email,
      phoneNumber,
      password: hashedPassword,
      fname,
      lname,
      role
    });
    return this.userRepository.save(user);
  }

  async login(loginAuthDto: LoginAuthDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const { email, password } = loginAuthDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create payloads
    const payload = { email: user.email, sub: user.id };
    const rolePayload = { role: user.role, sub: user.id };

    // Generate tokens
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.configService.get<string>('ACCESS_TOKEN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: this.configService.get<string>('REFRESH_TOKEN')
    });

    // Return access token and user details (excluding password)
    const { password: _, ...userDetails } = user; // Omit password from returned user object

    return { accessToken, refreshToken, user: userDetails };
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    if (users.length === 0) {
      throw new NotFoundException('No users found.');
    }
    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async update(id: string, updateAuthDto: UpdateAuthDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateAuthDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async countUsers(): Promise<number> {
    try {
      return await this.userRepository.count();
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }
  
  
  async findAllUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 10, search = '' } = query;
  
    // Build options for filtering and pagination
    const options: FindManyOptions<User> = {
      where: search
        ? [
            { email: Like(`%${search}%`) },
            { fname: Like(`%${search}%`) },
            { lname: Like(`%${search}%`) }
          ]
        : undefined,
      skip: (page - 1) * limit, // Pagination offset
      take: limit // Limit the number of records
    };
  
    // Retrieve data and total count
    const [data, total] = await this.userRepository.findAndCount(options);
  
    return { data, total };
  }

//   async registerRider(
//     email: string, 
//     userData: Partial<User>,
//     licenseData: Partial<DiverLicense> | Partial<Nin>, 
//     type: 'license' | 'nin',
// ) {
//     let user = await this.userRepository.findOne({ where: { email }, relations: ['driver', 'license'] });

//     if (user) {
//         // Prevent double registration
//         if (user.isRider) {
//             throw new BadRequestException('User is already registered as a rider or driver');
//         }

//         // If trying to register as a driver but already has a Nin, reject
//         if (type === 'license' && user.license) {
//             throw new BadRequestException('User already has a NIN and cannot register as a driver.');
//         }

//         // If trying to register as a NIN but already has a DiverLicense, reject
//         if (type === 'nin' && user.driver) {
//             throw new BadRequestException('User already has a driver’s license and cannot register with a NIN.');
//         }

//         // Update user details
//         Object.assign(user, userData);
//     } else {
//         // Create new user
//         user = this.userRepository.create(userData);
//         user.isRider = true;
//         user.role = UserRole.USER;
//     }

//     // Register as driver (DiverLicense)
//     if (type === 'license') {
//         const newLicense = this.licenseRepository.create(licenseData);
//         newLicense.user = user;
//         await this.licenseRepository.save(newLicense);
//         user.driver = newLicense;
//     } 
//     // Register as NIN
//     else if (type === 'nin') {
//         const newNin = this.ninRepository.create(licenseData);
//         newNin.user = user;
//         await this.ninRepository.save(newNin);
//         user.license = newNin;
//     }

//     await this.userRepository.save(user);
//     return user;
// }
async updateUserWithVerification(userId: string, userData: any) {
  const user = await this.userRepository.findOne({ where: { id: userId } });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  if (user.isRider) {
    throw new BadRequestException('User is already registered as a rider or driver');
  }

  // Fetch NIN and Driver’s License Details
  const ninData = await this.getNinDetails(userData.nin);
  const driverData = await this.getDriverLicenseDetails(userData.licenseNo);

  // Merge Data
  const updatedUserData = {
    ...userData,
    nin: ninData?.nin,
    fullName: `${ninData?.firstName} ${ninData?.middleName} ${ninData?.lastName}`,
    birthDate: ninData?.birthDate || driverData?.birthDate,
    gender: ninData?.gender || driverData?.gender,
    driverLicenseNumber: driverData?.licenseNo,
    licenseIssuedDate: driverData?.issuedDate,
    licenseExpiryDate: driverData?.expiryDate,
    stateOfIssue: driverData?.stateOfIssue,
  };

  // Update user record
  Object.assign(user, updatedUserData);
  await this.userRepository.save(user);

  return user;
}

async getNinDetails(nin: string) {
  const response = await this.httpService.axiosRef.get(
    `https://api.dikript.com/dikript/test/api/v1/getnin?nin=${nin}`,
    { headers: { 'x-api-key': 'dec72315-f996-4b85-be56-f18353832cd0' } },
  );
  return response.data.data;
}

async getDriverLicenseDetails(licenseNo: string) {
  const response = await this.httpService.axiosRef.get(
    `https://api.dikript.com/dikript/test/api/v1/getfrsc?frsc=${licenseNo}`,
    { headers: { 'x-api-key': 'dec72315-f996-4b85-be56-f18353832cd0' } },
  );
  return response.data.data;
}
}
