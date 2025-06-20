import {
    ValidationOptions,
    registerDecorator,
    ValidationArguments,
} from 'class-validator';

export default function IsValidObjectIds(validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'isValidObjectIds',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    const ids = value.split(',');
                    const objectIdRegex = /^[0-9a-fA-F]{24}$/; // Assuming object IDs are MongoDB ObjectId format

                    return ids.every((id) => objectIdRegex.test(id.trim()));
                },
            },
        });
    };
}