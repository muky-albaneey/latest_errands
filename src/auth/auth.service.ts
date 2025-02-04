
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
import { Nin, RiderType } from './entities/nin';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly apiUrl: string;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DiverLicense)
    private licenseRepository: Repository<DiverLicense>,
    @InjectRepository(Nin)
    private ninRepository: Repository<Nin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    // private readonly apiUrl: string,  // This will be injected from ConfigService
    // private readonly apiUrl : 'http://www.carqueryapi.com/api/0.3/',
    
  ) {
      // Initialize apiUrl from config
      this.apiUrl = this.configService.get<string>('API_URL');
    // this.apiUrl = this.configService.get<string>('API_URL'); // Properly assign to class property // Initialize apiUrl from config
  }

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

  async findOne(id): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['card', 'driver', 'license'], // Include related entities
    });
  
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


  async updateOrCreateUser(userData: any) {
    let user = null;
  
    // Check if user already exists based on email
    if (userData.email) {
      user = await this.userRepository.findOne({
        where: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
        relations: ['nin', 'driver'], // Load related entities
      });
    }
  
    if (user) {
      if (user.isRider) {
        throw new BadRequestException('User is already registered as a rider or driver');
      }
      if (userData.nin) {
        const ninData = await this.getNinDetails(userData.nin);
        const nin = user.nin || this.ninRepository.create();
  
        Object.assign(nin, {
          birthDate: ninData.birthDate,
          gender: ninData.gender,
          riderType: RiderType.RIDER,
          employmentStatus: ninData.employmentStatus,
          trackingId: ninData.trackingId,
          residenceAdressLine1: ninData.residenceAdressLine1,
          telephoneNo: ninData.telephoneNo,
          user: user,
        });
  
        user.nin = await this.ninRepository.save(nin);
      } else if (userData.licenseNo) {
        const driverData = await this.getDriverLicenseDetails(userData.licenseNo);
        if (!driverData) {
          throw new BadRequestException("Driver's license details could not be retrieved.");
        }
        
        const driver = user.driver || this.licenseRepository.create();
        console.log(driverData,11);
        Object.assign(driver, {
          licenseNo: driverData.licenseNo,
          birthdate: driverData.birthdate,
          gender: driverData.gender,
          issuedDate: driverData.issuedDate,
          expiryDate: driverData.expiryDate,
          stateOfIssue: driverData.stateOfIssue,
          user: user,
        });
  
        user.driver = await this.licenseRepository.save(driver);
      } else {
        throw new BadRequestException("User must provide either NIN or Driver's License");
      }
  
      user.isRider = true;
      await this.userRepository.save(user);
  
      return this.formatUserResponse(user);
    }
  
    // If user doesn't exist, create a new user
    if (!userData.nin && !userData.licenseNo) {
      throw new BadRequestException("User must provide either NIN or Driver's License");
    }
  
    if (userData.nin && userData.licenseNo) {
      throw new BadRequestException("User cannot have both NIN and Driver's License");
    }
  
    let newUser;
  
    if (userData.nin) {
      const ninData = await this.getNinDetails(userData.nin);
  
      newUser = this.userRepository.create({
        phoneNumber: userData.phoneNumber,
        fname: ninData.firstName,
        lname: ninData.middleName,
        email: userData.email,
        password: userData.password,
        role: UserRole.USER,
        isRider: true,
      });
  
      newUser = await this.userRepository.save(newUser);
  
      const nin = this.ninRepository.create({
        birthDate: ninData.birthDate,
        gender: ninData.gender,
        riderType: RiderType.RIDER,
        employmentStatus: ninData.employmentStatus,
        trackingId: ninData.trackingId,
        residenceAdressLine1: ninData.residenceAdressLine1,
        telephoneNo: ninData.telephoneNo,
        user: newUser,
      });
  
      newUser.nin = await this.ninRepository.save(nin);
    } else if (userData.licenseNo) {
      const driverData = await this.getDriverLicenseDetails(userData.licenseNo);
      if (!driverData) {
        throw new BadRequestException("Driver's license details could not be retrieved.");
      }
      console.log(driverData,2);
      
      newUser = this.userRepository.create({
        phoneNumber: userData.phoneNumber,
        fname: driverData.firstname,
        lname: driverData.lastname,
        email: userData.email,
        password: userData.password,
        role: UserRole.USER,
        isRider: true,
      });
      console.log(driverData, 3);

      newUser = this.userRepository.create({
        phoneNumber: userData.phoneNumber,
        fname: driverData.firstname,
        lname: driverData.lastname,
        email: userData.email,
        password: userData.password,
        role: UserRole.USER,
        isRider: true,
      });
      
      // Save the user first so it gets an ID
      newUser = await this.userRepository.save(newUser);
      
      console.log(driverData, 4);
      
      // Check if this user already has a DriverLicense
      const existingDriver = await this.licenseRepository.findOne({
        where: { user: newUser },
      });
      
      if (existingDriver) {
        throw new Error("This user already has a driver license.");
      }
      
      // Create a new driver license
      const driver = this.licenseRepository.create({
        licenseNo: driverData.licenseNo,
        birthdate: driverData.birthdate,
        gender: driverData.gender,
        issuedDate: driverData.issuedDate,
        expiryDate: driverData.expiryDate,
        stateOfIssue: driverData.stateOfIssue,
        user: newUser, // Now, newUser is saved and has an ID
      });
      
      // Save the driver license
      await this.licenseRepository.save(driver);
      
      // Update newUser with the driver reference (if needed)
      newUser.driver = driver;
      await this.userRepository.save(newUser);
      
    }
  
    return this.formatUserResponse(newUser);
  }
  private formatUserResponse(user: User) {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      isRider: user.isRider,
      nin: user.nin ? { trackingId: user.nin.trackingId } : null,
      driver: user.driver ? { licenseNo: user.driver.licenseNo } : null,
    };
  }
  

async getNinDetails(nin: string) {
  try {
    const response = await this.httpService.axiosRef.get(
      `https://api.dikript.com/dikript/test/api/v1/getnin?nin=${nin}`,
      { headers: { 'x-api-key': process.env.NIN_VER } }
    );

    // Check if the API response is successful and contains valid data
    if (response.data?.status === true && response.data?.data) {
      return response.data.data;
    } else {
      throw new BadRequestException(response.data?.error?.message || 'Failed to fetch NIN details');
    }
  } catch (error) {
    console.error('Error fetching NIN details:', error.message);
    throw new BadRequestException('Error retrieving NIN details. Please try again later.');
  }
}

async getDriverLicenseDetails(licenseNo: string) {
  try {
    const response = await this.httpService.axiosRef.get(
      `https://api.dikript.com/dikript/test/api/v1/getfrsc?frsc=${licenseNo}`,
      { headers: { 'x-api-key': process.env.BVN_VER } }
    );

    // Check if the API response is successful and contains valid data
    if (response.data?.status === true && response.data?.data) {
      return response.data.data;
    } else {
      throw new BadRequestException(response.data?.error?.message || 'Failed to fetch Driver License details');
    }
  } catch (error) {
    console.error('Error fetching Driver License details:', error.message);
    throw new BadRequestException('Error retrieving Driver License details. Please try again later.');
  }
}
  // Fetch car models based on make (e.g., Mercedes-Benz)
  async getCarModels(make: string): Promise<any> {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          cmd: 'getModels',
          make: make,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching car models: ${error.message}`);
    }
  }

    // Fetch car model details based on make and model
    async getCarModelDetails(make: string, model: string): Promise<any> {
      try {
        const response = await axios.get(this.apiUrl, {
          params: {
            cmd: 'getModel',
            make: make,
            model: model,
          },
        });
        return response.data;
      } catch (error) {
        throw new Error(`Error fetching car model details: ${error.message}`);
      }
    }

}
