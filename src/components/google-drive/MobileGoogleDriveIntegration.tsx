// Mobile-Optimized Google Drive Integration Component - Phase 5
// Touch-optimized, mobile-friendly Google Drive management interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { safeApiCall } from '@/lib/utils/safe-api';
import type { GoogleDriveFile, StudyMaterial } from '@/types/google-drive';

// Icons
import { 
  FileText, 
  FolderOpen, 
  Search, 
  RefreshCw, 
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  Zap,
  X
} from 'lucide-react';

interface MobileGoogleDriveIntegrationProps {
  userId: string;
  onClose?: () => void;
}

export function MobileGoogleDriveIntegration({ userId, onClose }: MobileGoogleDriveIntegrationProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState<'connect' | 'files' | 'materials'>('connect');

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, [userId]);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const result = await safeApiCall(`/api/google-drive/files?userId=${userId}&action=status`);
      
      if (result.success) {
        setIsConnected(true);
        setActiveView('files');
        await loadFiles();
        await loadStudyMaterials();
      } else {
        setIsConnected(false);
        setActiveView('connect');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
      setActiveView('connect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const result = await safeApiCall(`/api/google-drive/auth?userId=${userId}`);

      if (result.success) {
        // Redirect to Google OAuth
        window.location.href = result.data.authUrl;
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to initiate Google Drive connection',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to Google Drive',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const result = await safeApiCall(`/api/google-drive/files?userId=${userId}`);

      if (result.success && result.data) {
        setFiles(result.data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadStudyMaterials = async () => {
    try {
      const result = await safeApiCall('/api/google-drive/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'materials' })
      });

      if (result.success && result.data) {
        setStudyMaterials(result.data.materials || []);
      }
    } catch (error) {
      console.error('Error loading study materials:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadFiles();
      return;
    }

    try {
      setIsLoading(true);
      const result = await safeApiCall('/api/google-drive/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'search', 
          searchQuery: searchQuery.trim() 
        })
      });

      if (result.success && result.data) {
        setFiles(result.data.files || []);
        toast({
          title: 'Search Complete',
          description: `Found ${result.data.files?.length || 0} files`,
        });
      }
    } catch (error) {
      console.error('Error searching files:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search files',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleProcessFiles = async (fileIds: string[]) => {
    for (const fileId of fileIds) {
      try {
        setProcessingStatus(prev => ({ ...prev, [fileId]: 'processing' }));
        
        const result = await safeApiCall('/api/google-drive/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            fileId, 
            action: 'process' 
          })
        });

        if (result.success) {
          setProcessingStatus(prev => ({ ...prev, [fileId]: 'completed' }));
          await loadStudyMaterials();
          toast({
            title: 'Success',
            description: 'File processed successfully',
          });
        } else {
          setProcessingStatus(prev => ({ ...prev, [fileId]: 'failed' }));
          toast({
            title: 'Processing Failed',
            description: `Failed to process file: ${result.error}`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        setProcessingStatus(prev => ({ ...prev, [fileId]: 'failed' }));
        console.error(`Error processing file ${fileId}:`, error);
      }
    }

    setSelectedFiles(new Set());
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('text')) return '📄';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Connection View
  if (activeView === 'connect') {
    return (
      <div className="w-full max-w-md mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Connect Google Drive</h1>
          <p className="text-gray-600 mb-6">
            Connect your Google Drive to access and process your study materials
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isLoading ? 'Connecting...' : 'Connect Google Drive'}
            </Button>
            
            <Alert className="mt-6">
              <AlertDescription className="text-sm">
                You'll be redirected to Google for authorization. We only request read access to your files.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>
    );
  }

  // Main Interface
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Google Drive
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile Navigation Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={activeView === 'files' ? 'default' : 'outline'}
          onClick={() => setActiveView('files')}
          className="flex items-center justify-center gap-2 h-12"
          size="lg"
        >
          <FileText className="h-5 w-5" />
          Files ({files.length})
        </Button>
        <Button
          variant={activeView === 'materials' ? 'default' : 'outline'}
          onClick={() => setActiveView('materials')}
          className="flex items-center justify-center gap-2 h-12"
          size="lg"
        >
          <Upload className="h-5 w-5" />
          Materials ({studyMaterials.length})
        </Button>
      </div>

      {/* Files View */}
      {activeView === 'files' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadFiles}
                  disabled={isLoading}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selected Files Action */}
          {selectedFiles.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">
                      {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-blue-600">Tap Process to analyze as study materials</p>
                  </div>
                  <Button 
                    onClick={() => handleProcessFiles(Array.from(selectedFiles))}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Process
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedFiles.has(file.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.modifiedTime)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Processing Status */}
                      {processingStatus[file.id] && (
                        <div className="ml-2">
                          {processingStatus[file.id] === 'processing' && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs">Processing</span>
                            </div>
                          )}
                          {processingStatus[file.id] === 'completed' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Done</span>
                            </div>
                          )}
                          {processingStatus[file.id] === 'failed' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">Failed</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {files.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No files found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Materials View */}
      {activeView === 'materials' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Study Materials</CardTitle>
              <CardDescription className="text-sm">
                Processed files converted to study materials
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {studyMaterials.map((material) => (
              <Card key={material.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{material.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>{material.subject}</span>
                          <span>•</span>
                          <span className="capitalize">{material.difficulty}</span>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={
                          material.processingStatus === 'completed' ? 'default' :
                          material.processingStatus === 'failed' ? 'destructive' : 'secondary'
                        }
                        className="text-xs ml-2"
                      >
                        {material.processingStatus}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-medium text-gray-600">Words</p>
                        <p className="text-sm">{material.metadata.wordCount.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-medium text-gray-600">Topics</p>
                        <p className="text-sm">{material.topics.length}</p>
                      </div>
                    </div>

                    {/* Topics */}
                    {material.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {material.topics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {material.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{material.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Last accessed */}
                    <div className="text-xs text-gray-500">
                      Last accessed: {formatDate(material.metadata.lastAccessed)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {studyMaterials.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">No study materials yet</p>
                  <p className="text-sm text-gray-400">
                    Process some files to create study materials
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Close Button for Mobile */}
      {isMobile && onClose && (
        <Button variant="outline" onClick={onClose} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      )}
    </div>
  );
}

export default MobileGoogleDriveIntegration;
