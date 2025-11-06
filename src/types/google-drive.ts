// Google Drive Integration Types - Phase 4 Implementation
// Complete Google Drive OAuth and file processing types

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleDriveAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  thumbnailLink?: string;
  description?: string;
  isFolder: boolean;
  content?: string;
  extractedContent?: ExtractedContent;
}

export interface ExtractedContent {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    hasImages?: boolean;
    hasTables?: boolean;
  };
  analysis: {
    subject?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
    keyConcepts: string[];
    summary: string;
    studyTips: string[];
  };
}

export interface DriveFolder {
  id: string;
  name: string;
  path: string;
  files: GoogleDriveFile[];
  subfolders: DriveFolder[];
}

export interface DriveSearchParams {
  query?: string;
  mimeTypes?: string[];
  folders?: string[];
  dateRange?: {
    after?: string;
    before?: string;
  };
  sortBy?: 'modifiedTime' | 'createdTime' | 'name';
  sortOrder?: 'asc' | 'desc';
  maxResults?: number;
}

export interface DriveProcessingResult {
  success: boolean;
  fileId: string;
  extractedContent?: ExtractedContent;
  error?: string;
  processingTime: number;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  source: 'google_drive' | 'upload' | 'manual';
  fileId?: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'other';
  subject?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  content: string;
  metadata: {
    wordCount: number;
    pageCount?: number;
    language: string;
    hasImages: boolean;
    uploadedAt: string;
    lastAccessed: string;
    analysisScore: number; // How well the AI could analyze the content
  };
  tags: string[];
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface GoogleDriveSettings {
  isConnected: boolean;
  autoSync: boolean;
  allowedMimeTypes: string[];
  maxFileSize: number; // in bytes
  defaultFolder?: string;
  processingSettings: {
    extractText: boolean;
    analyzeContent: boolean;
    generateStudyTips: boolean;
    createSummaries: boolean;
  };
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
}

// API Response Types
export interface DriveAuthResponse {
  success: boolean;
  data?: {
    authUrl: string;
  };
  error?: string;
}

export interface DriveFilesResponse {
  success: boolean;
  data?: {
    files: GoogleDriveFile[];
    folders: DriveFolder[];
    totalFiles: number;
    hasMore: boolean;
    nextPageToken?: string;
  };
  error?: string;
}

export interface DriveProcessResponse {
  success: boolean;
  data?: {
    material: StudyMaterial;
    analysis: ExtractedContent;
  };
  error?: string;
}

// Integration with existing systems
export interface StudyMaterialSuggestion {
  materialId: string;
  materialName: string;
  relevanceScore: number;
  suggestedAction: 'review' | 'study' | 'analyze' | 'practice';
  relatedTopics: string[];
  estimatedStudyTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GoogleDriveIntegrationService {
  // Authentication
  getAuthUrl(): Promise<DriveAuthResponse>;
  handleAuthCallback(code: string): Promise<DriveAuthResponse>;
  refreshToken(): Promise<DriveAuthResponse>;
  revokeAuth(): Promise<DriveAuthResponse>;
  getAuthStatus(): Promise<boolean>;
  
  // File operations
  listFiles(params?: DriveSearchParams): Promise<DriveFilesResponse>;
  getFile(fileId: string): Promise<GoogleDriveFile | null>;
  downloadFile(fileId: string): Promise<Buffer | null>;
  searchFiles(query: string): Promise<DriveFilesResponse>;
  
  // Content processing
  extractContent(fileId: string): Promise<DriveProcessingResult>;
  analyzeContent(content: string): Promise<ExtractedContent>;
  processFileForStudy(fileId: string): Promise<DriveProcessResponse>;
  
  // Study materials integration
  createStudyMaterial(fileId: string, userId: string): Promise<StudyMaterial | null>;
  listStudyMaterials(userId: string): Promise<StudyMaterial[]>;
  getStudyMaterial(materialId: string): Promise<StudyMaterial | null>;
  updateStudyMaterial(materialId: string, updates: Partial<StudyMaterial>): Promise<boolean>;
  deleteStudyMaterial(materialId: string): Promise<boolean>;
  
  // Utility methods
  isSupportedFile(mimeType: string): boolean;
  getFileIcon(mimeType: string): string;
  formatFileSize(bytes: number): string;
}
