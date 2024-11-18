/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
// import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateAuthDto, LoginAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createUser(createUserDto: CreateAuthDto): Promise<User> {
    const { email, phoneNumber, password, fname, lname, role } = createUserDto;

    // Check if email or phone number already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phoneNumber }],
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
      role,
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
      secret: this.configService.get<string>('REFRESH_TOKEN'),
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

  
}
