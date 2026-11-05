export interface Collection {
  id: number;
  collectionName: string;
  collectionType: string;
  description?: string;
  status: string;
  properties: string[];
  collectionTables?: string[];
  isMuted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCollectionMembership {
  id: number;
  userId: number;
  collectionId: number;
  role: string;
  isActive: boolean;
  isMuted: boolean;
  collection: Collection;
}

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  iconName: string;
  badge?: string | number;
}
