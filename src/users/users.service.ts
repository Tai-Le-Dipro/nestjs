import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Connection, Model } from 'mongoose';
import { genSaltSync, hashSync } from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(User.name) private userModel: Model<User>
  ) { }

  async create(createUserDto: CreateUserDto) {
    const salt = genSaltSync(10);
    const hash = hashSync(createUserDto.password, salt);

    return await this.userModel.create({
      ...createUserDto,
      password: hash
    })
  }

  findAll() {
    return this.userModel.find()
  }

  async findOne(id: string) {
    try {
      const user = await this.userModel.findById({
        _id: id
      })
      if (!user) {
        throw new NotFoundException('User not found')
      } else {
        return user
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate({
        _id: id
      }, { ...updateUserDto })

      return updatedUser
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

  remove(id: string) {
    try {
      const deletedUser = this.userModel.deleteOne({
        _id: id
      })

      if (deletedUser) {
        return {
          message: 'User deleted successfully'
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}
