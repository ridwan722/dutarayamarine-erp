export interface usersM {
  id?: string;
  uid?: string;
  email: string;
  displayName: string;
  role: string;
  id_perusahaan: string;
  permissions: string[];
  active: boolean;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}
