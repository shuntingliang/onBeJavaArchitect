export type Gender = 'male' | 'female';
export type Status = 'active' | 'probation' | 'resigned';

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  position: string;
  department: string;
  phone: string;
  email: string;
  joinDate: string;
  status: Status;
}
