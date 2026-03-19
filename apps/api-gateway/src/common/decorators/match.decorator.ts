import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Constraint class that performs the actual comparison check for equality between two properties.
 */
@ValidatorConstraint({ name: 'Match', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  /**
   * Validates if the current property value matches the value of the property specified in constraints.
   */
  validate(value: unknown, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];
    return value === relatedValue;
  }

  /**
   * Default error message when validation fails.
   */
  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    return `${args.property} must match ${relatedPropertyName}`;
  }
}

/**
 * Constraint class that performs the check for inequality between two properties.
 */
@ValidatorConstraint({ name: 'NotMatch', async: false })
export class NotMatchConstraint implements ValidatorConstraintInterface {
  /**
   * Validates if the current property value does NOT match the value of the property specified in constraints.
   */
  validate(value: unknown, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];
    return value !== relatedValue;
  }

  /**
   * Default error message when validation fails.
   */
  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    return `${args.property} must not match ${relatedPropertyName}`;
  }
}

/**
 * Decorator to ensure that the decorated property matches another property of the same object.
 * Useful for "confirm password" fields.
 *
 * @param property The name of the other property to compare against.
 * @param validationOptions Standard class-validator options.
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

/**
 * Decorator to ensure that the decorated property does NOT match another property of the same object.
 * Useful for ensuring a new password is not the same as the current password.
 *
 * @param property The name of the other property to compare against.
 * @param validationOptions Standard class-validator options.
 */
export function NotMatch(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: NotMatchConstraint,
    });
  };
}
