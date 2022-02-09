export class ServiceError extends Error {
  public errorCode: ServiceErrorType;

  public status: number;

  public message: string;

  constructor(message: string, errorCode: ServiceErrorType, status?: number) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

export enum ServiceErrorType {
}
