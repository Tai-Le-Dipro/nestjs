import { IsEmail, isEmail, IsNotEmpty, IsStrongPassword, Min, MinLength } from "class-validator";

export class CreateUserDto {
    @MinLength(3)
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string
}
