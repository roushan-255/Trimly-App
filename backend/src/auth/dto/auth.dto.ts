export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupCredentialsDto extends LoginDto {
  phone?: string;
}

interface BaseSignupDto extends SignupCredentialsDto {
  firstName: string;
  lastName: string;
}

export interface CustomerSignupDto extends BaseSignupDto {
  avatar?: string;
}

export interface ShopOwnerSignupDto extends BaseSignupDto {
  avatarUrl?: string;
  businessLegalName?: string;
  gstin?: string;
  panNumber?: string;
}

export interface BarberSignupDto extends SignupCredentialsDto {
  shopId: string;
  displayName: string;
  bio?: string;
}

export interface AdminSignupDto extends BaseSignupDto {
  avatarUrl?: string;
  designation?: string;
  department?: string;
}
