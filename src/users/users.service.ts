import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Connection } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const salt = genSaltSync(10);
    const hash = hashSync(createUserDto.password, salt);
    // check email exits
    const user = await this.userModel.findOne({ email: createUserDto.email });
    if (user) {
      throw new ConflictException('Email already exists');
    }
    return await this.userModel.create({
      ...createUserDto,
      password: hash,
    });
  }

  findAll() {
    return this.userModel.find();
  }

  async findOne(id: string) {
    try {
      const user = await this.userModel.findById({
        _id: id,
      });
      if (!user) {
        throw new NotFoundException('User not found');
      } else {
        return user;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        {
          _id: id,
        },
        { ...updateUserDto },
      );

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Handle invalid MongoDB ObjectId
      if (error.name === 'CastError') {
        throw new NotFoundException(`Invalid user ID format`);
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string) {
    const result = await this.userModel.softDelete({
      _id: id,
    });

    if (!result) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return result;
  }

  comparePasswords(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
