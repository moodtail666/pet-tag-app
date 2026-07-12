export type TagStatus = "unactivated" | "active" | "lost" | "disabled";

export type Tag = {
  id: string;
  tag_id: string;
  activation_code: string;
  owner_user_id: string | null;
  owner_email: string | null;
  status: TagStatus;
  activated_at: string | null;
};

export type Pet = {
  id: string;
  tag_id: string;
  owner_user_id: string | null;
  owner_email: string;
  name: string;
  photo_url: string | null;
  breed: string | null;
  age: string | null;
  sex: string | null;
  address: string | null;
  about: string | null;
  contact_name_1: string | null;
  contact_phone_1: string | null;
  contact_name_2: string | null;
  contact_phone_2: string | null;
  contact_email: string | null;
  show_phone: boolean;
  show_address: boolean;
};
