// Google Drive Integration Component - Phase 4
// React component for Google Drive OAuth and file management

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { GoogleDriveFile, StudyMaterial } from '@/types/google-drive';

interface GoogleDriveIntegrationProps {
  userId: string;
  onClose?: () => void;
}

export function GoogleDriveIntegration({ userId, onClose }: GoogleDriveIntegrationProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, [userId]);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/google-drive/files?userId=${userId}&action=status`);
      const result = await response.json();
      
      if (result.success) {
        setIsConnected(true);
        await loadFiles();
        await loadStudyMaterials();
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/google-drive/auth?userId=${userId}`);
      const result = await response.json();

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
      const response = await fetch(`/api/google-drive/files?userId=${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setFiles(result.data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadStudyMaterials = async () => {
    try {
      const response = await fetch('/api/google-drive/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'materials' })
      });
      const result = await response.json();

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
      const response = await fetch('/api/google-drive/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'search', 
          searchQuery: searchQuery.trim() 
        })
      });
      const result = await response.json();

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
        
        const response = await fetch('/api/google-drive/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            fileId, 
            action: 'process' 
          })
        });
        const result = await response.json();

        if (result.success) {
          setProcessingStatus(prev => ({ ...prev, [fileId]: 'completed' }));
          // Refresh study materials
          await loadStudyMaterials();
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

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect to Google Drive</CardTitle>
          <CardDescription>
            Connect your Google Drive to access and process your study materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect Google Drive'}
          </Button>
          <Alert className="mt-4">
            <AlertDescription>
              You'll be redirected to Google for authorization. We only request read access to your files.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Drive Integration</CardTitle>
              <CardDescription>
                Connected to your Google Drive account
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files">Browse Files</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Files</CardTitle>
              <CardDescription>
                Search your Google Drive for study materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  Search
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadFiles}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Files</CardTitle>
                {selectedFiles.size > 0 && (
                  <Button 
                    onClick={() => handleProcessFiles(Array.from(selectedFiles))}
                    disabled={isLoading}
                  >
                    Process {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
              <CardDescription>
                Select files to process as study materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleFileSelect(file.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • Modified {formatDate(file.modifiedTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {processingStatus[file.id] && (
                            <Badge 
                              variant={
                                processingStatus[file.id] === 'completed' ? 'default' :
                                processingStatus[file.id] === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {processingStatus[file.id]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Materials</CardTitle>
              <CardDescription>
                Processed files converted to study materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {studyMaterials.map((material) => (
                    <div key={material.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{material.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {material.subject} • {material.difficulty}
                          </p>
                          <p className="text-sm text-gray-500">
                            {material.metadata.wordCount} words • 
                            {material.topics.slice(0, 3).join(', ')}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {material.topics.slice(0, 5).map((topic, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            material.processingStatus === 'completed' ? 'default' :
                            material.processingStatus === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {material.processingStatus}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(material.metadata.lastAccessed)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {studyMaterials.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No study materials yet. Process some files to get started!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

export default GoogleDriveIntegration;
