
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
import { CreateAuthDto, CreateAuthDtoDriver, LoginAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { DiverLicense } from './entities/license.entity';
import { Nin, RiderType } from './entities/nin';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { LocationDrive } from './entities/location_drive';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/vehicle.dto';
import * as AWS from 'aws-sdk';
import { ProfileImage } from './entities/profile.entity';
import * as path from 'path';
import { plateNum } from './entities/plateNum.entity';
import { LicenseImg } from './entities/licenseImg.entity';
import { VehicleReg } from './entities/VehicleReg.entity';

@Injectable()
export class AuthService {
  private readonly apiUrl: string;
  private s3: AWS.S3;
  private bucketName: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DiverLicense)
    private licenseRepository: Repository<DiverLicense>,
    @InjectRepository(Nin)
    private ninRepository: Repository<Nin>,
    @InjectRepository(LocationDrive)
    private locationDriveRepository: Repository<LocationDrive>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(ProfileImage)
    private readonly profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(plateNum)
    private readonly plateImageRepository: Repository<plateNum>,
    @InjectRepository(LicenseImg)
    private readonly licenseImageRepository: Repository<LicenseImg>,
    @InjectRepository(VehicleReg)
    private readonly vehicleRegImageRepository: Repository<VehicleReg>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    
  ) {
      // Initialize apiUrl from config
      this.apiUrl = this.configService.get<string>('API_URL');
       // Set bucket 
    // this.s3 = new AWS.S3({
    //   endpoint: process.env.LINODE_BUCKET_ENDPOINT, // Linode bucket endpoint
    //   accessKeyId: process.env.LINODE_ACCESS_KEY, // Access key
    //   secretAccessKey: process.env.LINODE_SECRET_KEY, // Secret key
    //   region: process.env.LINODE_BUCKET_REGION, // Bucket region
    //   s3ForcePathStyle: true, // Linode-specific setting
    // });
     this.s3 = new AWS.S3({
      endpoint: 'https://us-southeast-1.linodeobjects.com',
      region: 'us-southeast-1',
      accessKeyId: 'TZDQ6OXF5EVG189VJ80R',
      secretAccessKey: 'fcmd8yYuHeFOKja3QXcm6DyCTeRe9WglTfMWJJJX',
      signatureVersion: 'v4',
    });
    
    
    this.bucketName = process.env.LINODE_BUCKET_NAME; // Set bucket name
  }

  async uploadFileToLinode(file: Express.Multer.File): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: `${Date.now()}-${file.originalname}`, // Unique filename
      Body: file.buffer, // File content
      ContentType: file.mimetype, // Set content type (e.g., image/jpeg)
      ACL: 'public-read', // Make the file publicly accessible
    };
  
    
    try {
      const uploadResult = await this.s3.upload(params).promise();
      return uploadResult.Location; // Return the URL of the uploaded file
    } catch (error) {
      // console.error('Linode Upload Error:', error); // 👈 Add this
      throw new BadRequestException('Error uploading file to Linode Object Storage',error);
    }
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
    const users = await this.userRepository.find({
      relations: ['card', 'driverLicense', 'nin', 'vehicle', 'location_drive','vehicle_reg_image','Profile_img','plateNum_img','licenseImg'], // include all needed relations
    });
  
    if (users.length === 0) {
      throw new NotFoundException('No users found.');
    }
  
    return users;
  }
  

  async findOne(id): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['card', 'driverLicense', 'nin','vehicle','location_drive','vehicle_reg_image','Profile_img','plateNum_img','licenseImg',], // Include related entities
    });
  
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
  
    return user;
  }
  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },  // Find by email, not by UUID
      relations: ['card', 'driverLicense', 'nin', 'vehicle', 'location_drive'],
    });
  
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
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
      // console.error('Error counting users:', error);
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
  async createUserDriver(createUserDto: CreateAuthDtoDriver): Promise<User> {
    const { email, phoneNumber, password, fname, lname, role, drive_country, drive_city } = createUserDto;
  
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
    const savedUser = await this.userRepository.save(user);
  
    // Create and save the location details if provided
    if (drive_country || drive_city) {
      const location = this.locationDriveRepository.create({
        drive_country,
        drive_city,
        user: savedUser
      });
      await this.locationDriveRepository.save(location);
      savedUser.location_drive = location;
    }
  
    return savedUser;
  }
  

  async updateOrCreateUser(userData: any) {
    let user = null;
  
    // Check if user already exists based on email
    if (userData.email) {
      user = await this.userRepository.findOne({
        where: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
        relations: ['nin', 'driverLicense'], // Load related entities
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
        
        const driver = user.driverLicense || this.licenseRepository.create();
        // console.log(driverData,11);
        Object.assign(driver, {
          licenseNo: driverData.licenseNo,
          birthdate: driverData.birthdate,
          gender: driverData.gender,
          issuedDate: driverData.issuedDate,
          expiryDate: driverData.expiryDate,
          stateOfIssue: driverData.stateOfIssue,
          user: user,
        });
  
        user.driverLicense = await this.licenseRepository.save(driver);
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
      // console.log(driverData,2);
      
      newUser = this.userRepository.create({
        phoneNumber: userData.phoneNumber,
        fname: driverData.firstname,
        lname: driverData.lastname,
        email: userData.email,
        password: userData.password,
        role: UserRole.USER,
        isRider: true,
      });
      // console.log(driverData, 3);

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
      
      // console.log(driverData, 4);
      
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
      newUser.driverLicense = driver;
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
      driver: user.driverLicense ? { licenseNo: user.driverLicense.licenseNo } : null,
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
    // console.error('Error fetching NIN details:', error.message);
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
    // console.error('Error fetching Driver License details:', error.message);
    throw new BadRequestException('Error retrieving Driver License details. Please try again later.');
  }
}

// // GET BRANDS
// async getCarBrands(): Promise<any> {
//   try {
//     const response = await axios.get(this.apiUrl, {
//       params: {
//         cmd: 'getMakes',
//         callback: '', // Important to get JSON instead of JSONP
//       },
//     });

//     return response.data.Makes; // this contains the array of brands
//   } catch (error) {
//     throw new Error(`Error fetching car brands: ${error.message}`);
//   }
// }
async getCarBrands(): Promise<any> {
  try {
    const response = await axios.get(
      'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json',
    );
    return response.data.Results; // contains array of car brands
  } catch (error) {
    throw new Error(`Error fetching car brands: ${error.message}`);
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

    async createOrUpdateVehicle(email: string, dto: CreateVehicleDto) {
      const user = await this.userRepository.findOne({ where: { email }, relations: ['vehicle'] });
  
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
  
      if (!user.isRider) {
        throw new Error('Only riders can create or update a vehicle');
      }
  
      let vehicle = await this.vehicleRepository.findOne({ where: { id: user.vehicle?.id } });
  
      if (vehicle) {
        // Update existing vehicle
        vehicle = this.vehicleRepository.merge(vehicle, dto);
      } else {
        // Create new vehicle
        vehicle = this.vehicleRepository.create(dto);
        vehicle.user = user;
      }
  
      vehicle.user = user;
      await this.vehicleRepository.save(vehicle);

      user.vehicle = vehicle; // 🔥 Ensure the user object is aware of the relationship
      await this.userRepository.save(user);

      return user;
    }
  
    async getVehicleByUser(email: string) {
      const user = await this.userRepository.findOne({ where: { email }, relations: ['vehicle'] });
  
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
  
      return user.vehicle;
    }
    // private async upsertUserImage<T extends { name: string; url: string; ext: string; user: User }>(
    //   repo: Repository<T>,
    //   file: Express.Multer.File,
    //   user: User,
    // ): Promise<T> {
    //   const fileUrl = await this.uploadFileToLinode(file);
    
    //   const existing = await repo.findOne({
    //     where: { user: { id: user.id } },
    //     relations: ['user'],
    //   });
    
    //   if (existing) {
    //     existing.name = file.originalname;
    //     existing.url = fileUrl;
    //     existing.ext = path.extname(file.originalname).slice(1);
    //     return await repo.save(existing);
    //   } else {
    //     const newImage = repo.create({
    //       name: file.originalname,
    //       url: fileUrl,
    //       ext: path.extname(file.originalname).slice(1),
    //       user,
    //     });
    //     return await repo.save(newImage);
    //   }
    // }
    
    // Then just call:
//     const img = await this.upsertUserImage(this.profileImageRepository, file, user);
// user.Profile_img = img;
// await this.userRepository.save(user);

async createProfileImage(file: Express.Multer.File, user: User) {
  if (!file) throw new BadRequestException('Image file is required');

  const fileUrl = await this.uploadFileToLinode(file);

  const existing = await this.profileImageRepository.findOne({
    where: { user: { id: user.id } },
    relations: ['user'],
  });

  let profileImage;

  if (existing) {
    existing.name = file.originalname;
    existing.url = fileUrl;
    existing.ext = path.extname(file.originalname).slice(1);
    profileImage = await this.profileImageRepository.save(existing);
  } else {
    profileImage = this.profileImageRepository.create({
      name: file.originalname,
      url: fileUrl,
      ext: path.extname(file.originalname).slice(1),
      user: user,
    });
    await this.profileImageRepository.save(profileImage);
  }

  user.Profile_img = profileImage;
  await this.userRepository.save(user);

  return { message: 'Profile image uploaded successfully', fileUrl };
}

async createPlateNumImage(file: Express.Multer.File, user: User) {
  if (!file) throw new BadRequestException('Image file is required');

  const fileUrl = await this.uploadFileToLinode(file);

  const existing = await this.plateImageRepository.findOne({
    where: { user: { id: user.id } },
    relations: ['user'],
  });

  let plateImage;

  if (existing) {
    existing.name = file.originalname;
    existing.url = fileUrl;
    existing.ext = path.extname(file.originalname).slice(1);
    plateImage = await this.plateImageRepository.save(existing);
  } else {
    plateImage = this.plateImageRepository.create({
      name: file.originalname,
      url: fileUrl,
      ext: path.extname(file.originalname).slice(1),
      user: user,
    });
    await this.plateImageRepository.save(plateImage);
  }

  // Optional: assign to user if user has a plateNum relation
  user.plateNum_img = plateImage;
  await this.userRepository.save(user);

  return { message: 'Plate number image uploaded successfully', fileUrl };
}

async createVehicleImage(file: Express.Multer.File, user: User) {
  if (!file) throw new BadRequestException('Image file is required');

  const fileUrl = await this.uploadFileToLinode(file);

  const existing = await this.vehicleRegImageRepository.findOne({
    where: { user: { id: user.id } },
    relations: ['user'],
  });

  let vehicleImage;

  if (existing) {
    existing.name = file.originalname;
    existing.url = fileUrl;
    existing.ext = path.extname(file.originalname).slice(1);
    vehicleImage = await this.vehicleRegImageRepository.save(existing);
  } else {
    vehicleImage = this.vehicleRegImageRepository.create({
      name: file.originalname,
      url: fileUrl,
      ext: path.extname(file.originalname).slice(1),
      user: user,
    });
    await this.vehicleRegImageRepository.save(vehicleImage);
  }

  user.vehicle_reg_image = vehicleImage;
  await this.userRepository.save(user);

  return { message: 'Vehicle registration image uploaded successfully', fileUrl };
}
async createLicenseImage(file: Express.Multer.File, user: User) {
  if (!file) throw new BadRequestException('Image file is required');

  const fileUrl = await this.uploadFileToLinode(file);

  const existing = await this.licenseImageRepository.findOne({
    where: { user: { id: user.id } },
    relations: ['user'],
  });

  let licenseImage;

  if (existing) {
    existing.name = file.originalname;
    existing.url = fileUrl;
    existing.ext = path.extname(file.originalname).slice(1);
    licenseImage = await this.licenseImageRepository.save(existing);
  } else {
    licenseImage = this.licenseImageRepository.create({
      name: file.originalname,
      url: fileUrl,
      ext: path.extname(file.originalname).slice(1),
      user: user,
    });
    await this.licenseImageRepository.save(licenseImage);
  }

  user.licenseImg = licenseImage;
  await this.userRepository.save(user);

  return { message: 'License image uploaded successfully', fileUrl };
}
    async deleteVehicle(email: string) {
      const user = await this.userRepository.findOne({ where: { email }, relations: ['vehicle'] });
  
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
  
      if (!user.vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
  
      await this.vehicleRepository.delete(user.vehicle.id);
      return { message: 'Vehicle deleted successfully' };
    }
}
