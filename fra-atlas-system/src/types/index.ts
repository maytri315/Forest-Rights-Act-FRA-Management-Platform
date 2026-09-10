export interface NavigationModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  userRoles: string[];
}

export interface State {
  id: string;
  name: string;
  code: string;
}

export type UserRole = 'ministry' | 'district' | 'forest' | 'revenue' | 'ngo' | 'admin';

// File Upload Types
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  uploadedAt: Date;
  processedData?: FRADocumentData;
  error?: string;
}

export interface FRADocumentData {
  documentType: 'IFR' | 'CR' | 'CFR' | 'Application' | 'Verification' | 'Other';
  villageName?: string;
  pattalHolderName?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landArea?: number;
  claimStatus?: 'pending' | 'approved' | 'rejected' | 'under_review';
  documentNumber?: string;
  applicationDate?: Date;
  verificationDate?: Date;
  approvalDate?: Date;
  extractedText?: string;
  confidence: number;
}
