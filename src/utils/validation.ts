import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsColor(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "IsColor",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          if (["white", "black"].includes(value)) return true;
          return false;
        },
      },
    });
  };
}

export function IsPiece(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "IsPiece",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          if (
            ["queen", "king", "rook", "bishop", "knight", "pawn"].includes(
              value
            )
          )
            return true;
          return false;
        },
      },
    });
  };
}

export function IsAlgebraic(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "IsAlgebraic",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          if (value.length !== 2) return false;
          const [file, rank] = value;
          const charCode = file.charCodeAt(0);
          const num = parseInt(rank);
          if (charCode < 97 || charCode > 104) return false;
          if (num < 1 || num > 8) return false;
          return true;
        },
      },
    });
  };
}

export function IsCastle(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "IsCastle",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          if (["queen", "king"].includes(value)) return true;
          return false;
        },
      },
    });
  };
}
