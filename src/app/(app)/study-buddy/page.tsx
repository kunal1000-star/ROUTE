'use client';

import React, { useState, Suspense } from 'react';
import { Settings, Plus, BookOpen, Upload, Brain, Target, Zap, Star, AlertCircle, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import MemoryReferences from '@/components/study-buddy/memory-references';
import MLStudyInsights from '@/components/ai/MLStudyInsights';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ProviderSelector from '@/components/chat/ProviderSelector';
import StudyContextPanel from '@/components/chat/StudyContextPanel';
import StudentProfileCard from '@/components/study-buddy/StudentProfileCard';
import StudyBuddyChat from '@/components/study-buddy/study-buddy-chat';
import { FileUploadModal } from '@/components/study-buddy/FileUploadModal';
import { useStudyBuddy } from '@/hooks/use-study-buddy';

function StudyBuddyPage() {
  const {
    messages,
    isLoading,
    sessionId,
    userId,
    conversationId,
    preferences,
    studyContext,
    isSettingsOpen,
    isContextOpen,
    profileData,
    handleSendMessage,
    startNewChat,
    clearChat,
    savePreferences,
    saveStudyContext,
    toggleSettings,
    toggleContext,
    exportChat,
    fetchProfileData,
  } = useStudyBuddy();

  // State for file upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [insightsRunSignal, setInsightsRunSignal] = useState(0);

  return (
    <div className="flex h-full bg-gradient-to-br from-blue-50/50 to-purple-50/30">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <div className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
          <div className="flex h-16 items-center px-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My AI Coach
                </h1>
                <p className="text-xs text-muted-foreground">Personalized study help with your data</p>
              </div>
            </div>
            
            <div className="flex-1" />
            
            {/* Student Profile Card */}
            {userId && (
              <div className="hidden lg:block">
                <StudentProfileCard userId={userId} className="w-80" />
              </div>
            )}
            
            {/* New Chat Button */}
            <Button 
              onClick={startNewChat}
              variant="outline" 
              size="sm"
              className="hidden lg:flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>

            {/* AI Insights Button */}
            <Button 
              onClick={() => {
                // Refresh profile data and trigger insights refresh in Personalized tab
                fetchProfileData();
                setInsightsRunSignal((s) => s + 1);
                const el = document.getElementById('personalized-tab-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline" 
              size="sm"
              className="hidden lg:flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Insights
            </Button>

            {/* Upload Material Button */}
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              variant="default" 
              size="sm"
              className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Upload className="h-4 w-4" />
              Upload Material
            </Button>
            
            <div className="flex items-center gap-2">
              {/* Settings Button */}
              <Sheet open={isSettingsOpen} onOpenChange={toggleSettings}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Study Buddy Settings</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <ProviderSelector
                      value={preferences.provider}
                      onValueChange={(provider) => savePreferences({ provider })}
                      selectedModel={preferences.model}
                      onModelChange={(model) => savePreferences({ model })}
                    />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Stream Responses</label>
                        <input
                          type="checkbox"
                          checked={preferences.streamResponses}
                          onChange={(e) => savePreferences({ streamResponses: e.target.checked })}
                          className="rounded"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Creativity Level</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={preferences.temperature}
                          onChange={(e) => savePreferences({ temperature: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">{preferences.temperature}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Response Length</label>
                        <input
                          type="number"
                          min="100"
                          max="4096"
                          value={preferences.maxTokens}
                          onChange={(e) => savePreferences({ maxTokens: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Study Context Button */}
              <Sheet open={isContextOpen} onOpenChange={toggleContext}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Study Context</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <StudyContextPanel
                      value={studyContext}
                      onChange={saveStudyContext}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Action Buttons */}
              <Button variant="ghost" size="sm" onClick={exportChat}>
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={clearChat}>
                Clear
              </Button>
            </div>
          </div>
          
          {/* Mobile Student Profile Card */}
          {userId && (
            <div className="lg:hidden px-4 pb-3">
              <StudentProfileCard userId={userId} />
            </div>
          )}

          {/* Mobile Upload Button */}
          <div className="lg:hidden px-4 pb-3 flex gap-2">
            <Button 
              onClick={startNewChat}
              variant="outline" 
              size="sm"
              className="flex-1 items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              variant="default" 
              size="sm"
              className="flex-1 items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        {/* Tabs: Chat and Personalized */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="personalized">Personalized</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <StudyBuddyChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                preferences={preferences}
                onUpdatePreferences={savePreferences}
                studyContext={studyContext}
              />
            </div>
          </TabsContent>

          <TabsContent value="personalized" className="flex-1 overflow-hidden">
            <div id="personalized-tab-anchor" className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
              {/* Chat area */}
              <div className="col-span-12 lg:col-span-8">
                <StudyBuddyChat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  preferences={preferences}
                  onUpdatePreferences={savePreferences}
                  studyContext={studyContext}
                />
              </div>

              {/* Personalized side panel */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* Advanced ML Insights */}
                <Card className="p-4">
                  <MLStudyInsights runSignal={insightsRunSignal} />
                </Card>
                {userId && (
                  <StudentProfileCard userId={userId} />
                )}

                {/* AI Insights Panel (parity with StudyBuddy) */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-sm">Personalized Study Analysis</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Reuse same handler via a small prompt to ask user to use the Analyze button in header
                        // The header StudyBuddyPage has a Sparkles button wired to generate insights. Here we can prompt.
                        alert('Use the AI Insights button in the header to generate your latest analysis.');
                      }}
                      className="text-xs"
                    >
                      Generate
                    </Button>
                  </div>

                  {/* Summary cards similar to StudyBuddy */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium">Accuracy</span>
                      </div>
                      <div className="text-xl font-bold text-green-600">{profileData?.studyProgress?.accuracy || 78}%</div>
                      <Progress value={profileData?.studyProgress?.accuracy || 78} className="h-1.5" />
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-medium">Streak</span>
                      </div>
                      <div className="text-xl font-bold text-orange-600">{profileData?.currentData?.streak || 7}d</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(profileData?.currentData?.streak || 7, 7) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-orange-500" />
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Subject Performance</span>
                    </div>
                    <div className="space-y-2">
                      {(profileData?.strongSubjects || []).map((subject, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm">{subject}</span>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm text-green-500">Strong</span>
                          </div>
                        </div>
                      ))}
                      {(profileData?.weakSubjects || []).map((subject, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm">{subject}</span>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-sm text-orange-500">Needs Work</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Card>

                {/* Study Context Panel */}
                <Card className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm">Study Context</h3>
                    <p className="text-xs text-muted-foreground">Set your current subject, topic, and goals to personalize responses.</p>
                  </div>
                  <StudyContextPanel
                    value={studyContext}
                    onChange={saveStudyContext}
                  />
                </Card>

                {/* Latest Memory References from messages */}
                {messages.filter(m => m.role === 'assistant' && m.memory_references && m.memory_references.length > 0).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      Latest Memory References
                    </h3>
                    {/* Render the memory references from the latest assistant message */}
                    {(() => {
                      const latest = [...messages].reverse().find(m => m.role === 'assistant' && m.memory_references && m.memory_references.length > 0);
                      return latest ? (
                        <MemoryReferences memoryReferences={latest.memory_references as any} />
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAnalysisComplete={(analysis) => {
            console.log('File analysis completed:', analysis);
            // You could integrate this with the chat to discuss the file
            handleSendMessage(`I've uploaded and analyzed "${analysis.fileName}". ${analysis.analysis.summary}`);
          }}
        />
      </div>
    </div>
  );
}

export default function StudyBuddyPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex h-full bg-gradient-to-br from-blue-50/50 to-purple-50/30">
        <div className="flex-1 flex flex-col">
          <div className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
            <div className="flex h-16 items-center px-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My AI Coach
                  </h1>
                  <p className="text-xs text-muted-foreground">Personalized study help with your data</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading Study Buddy...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <StudyBuddyPage />
    </Suspense>
  );
}
