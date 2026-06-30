import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ScreenName, Task, LinguasenseTask } from '../types';
import { Header } from '../components/Shared';
import { supabase } from '../supabaseClient';
import * as TaskService from '../services/taskService';
import { MediaCapture } from '../services/mediaCapture';
import { getActiveTasks } from '../services/marketplaceService';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SPACING, LAYOUT, TEXT_STYLES } from '../constants/designTokens';

interface ScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onCompleteTask?: (reward: number, xp: number) => void;
  session?: { user: { id: string; email?: string; full_name?: string } | null };
}



export const TaskMarketplaceScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'All' | 'Audio' | 'Text' | 'Image'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const featuredTasksList = [
    { id: 'f1', title: 'AI Perception Lab', description: 'Validate object depth in 3D lidar scans.', reward: 2.50, time: '3m', colors: ['#2563eb', '#4338ca'] as [string, string] },
    { id: 'f2', title: 'Neural Audit v2', description: 'Review high-sensitivity dialogue safety.', reward: 1.80, time: '2m', colors: ['#7c3aed', '#db2777'] as [string, string] },
    { id: 'f3', title: 'Visual Grounding', description: 'Identify spatial relationships in scenes.', reward: 3.10, time: '5m', colors: ['#059669', '#0d9488'] as [string, string] }
  ];

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getActiveTasks();
      if (data && data.length > 0) {
        setTasks(data);
      } else {
        // Fallback or empty state
        setTasks([]);
        // Optional: setError('No active tasks found.'); 
      }
    } catch (e) {
      console.error("Connection error during handshake");
      setError("Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t =>
    (filter === 'All' || t.type.toLowerCase() === filter.toLowerCase()) &&
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header
        title="Task"
        onBack={() => onNavigate(ScreenName.HOME)}
        rightAction={
          <TouchableOpacity onPress={handleRefresh} className="p-2">
            <MaterialIcons name="refresh" size={24} color={isLoading ? '#1349ec' : '#94a3b8'} />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Search */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-4">
            <MaterialIcons name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search active protocols..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-slate-900 dark:text-white"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-4">
          <View className="flex-row gap-2">
            {['All', 'Audio', 'Text', 'Image'].map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f as any)} className={`px-5 py-2.5 rounded-full ${filter === f ? 'bg-primary' : 'bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800'}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-widest ${filter === f ? 'text-white' : 'text-slate-500'}`}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <View className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mb-4" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing with Central Ledger...</Text>
          </View>
        ) : error ? (
          <View className="py-20 items-center justify-center px-4">
            <MaterialIcons name="cloud-off" size={48} color="#94a3b8" />
            <Text className="text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">{error}</Text>
            <TouchableOpacity onPress={handleRefresh} className="mt-6 bg-primary px-6 py-3 rounded-xl">
              <Text className="text-white font-bold uppercase text-xs">Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4 gap-6">
            {/* Train Your AI Card */}
            {!searchQuery && (
              <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="relative overflow-hidden p-6 rounded-3xl bg-slate-900 border border-white/5">
                <View className="absolute top-0 right-0 opacity-20">
                  <MaterialIcons name="psychology" size={100} color="#1349ec" />
                </View>
                <View className="relative z-10">
                  <View className="bg-primary/20 px-2 py-0.5 rounded self-start mb-3 border border-primary/30">
                    <Text className="text-[10px] font-bold text-primary uppercase tracking-widest">Laboratory</Text>
                  </View>
                  <Text className="text-2xl font-bold text-white uppercase tracking-tighter mb-2">Train your{'\n'}own AI</Text>
                  <Text className="text-slate-400 text-sm mb-4">Personalize models with your data and preferences.</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">Open Neural Lab</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#1349ec" />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Featured Tasks */}
            {!searchQuery && (
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Featured Tasks</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-4">
                    {featuredTasksList.map((fTask) => (
                      <TouchableOpacity
                        key={fTask.id}
                        onPress={() => onNavigate(ScreenName.CAPTURE_AUDIO, {
                          promptText: "Open the pod bay doors",
                          context: "Voice Command"
                        })}
                        style={{ marginRight: 16 }}
                        className="w-72 rounded-3xl overflow-hidden"
                      >
                        <LinearGradient colors={fTask.colors} style={{ padding: 24 }}>
                          <View className="absolute top-0 right-0 opacity-10">
                            <MaterialIcons name="auto-awesome" size={100} color="white" />
                          </View>
                          <View className="relative z-10">
                            <View className="bg-white/20 px-2 py-1 rounded self-start mb-3">
                              <Text className="text-[10px] font-semibold text-white uppercase tracking-widest">Priority Contract</Text>
                            </View>
                            <Text className="text-xl font-bold text-white uppercase tracking-tight mb-1">{fTask.title}</Text>
                            <Text className="text-white/70 text-sm mb-4 h-10">{fTask.description}</Text>
                            <View className="flex-row justify-between items-end">
                              <View className="flex-row gap-3">
                                <View className="flex-row items-center gap-1">
                                  <MaterialIcons name="schedule" size={14} color="white" />
                                  <Text className="text-[10px] font-semibold text-white">{fTask.time}</Text>
                                </View>
                              </View>
                              <Text className="text-2xl font-bold text-white">${(fTask.reward || 0).toFixed(2)}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Available Missions */}
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Available Missions</Text>
              <View className="gap-3">
                {filteredTasks.map((task) => (
                  <TouchableOpacity key={task.id} onPress={() => onNavigate(ScreenName.TASK_DETAILS)} className="flex-row items-center p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                    <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center mr-3">
                      <MaterialIcons name={task.type === 'audio' ? 'mic' : task.type === 'text' ? 'description' : 'image'} size={20} color="#1349ec" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900 dark:text-white text-sm uppercase">{task.title}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="flex-row items-center gap-1">
                          <MaterialIcons name="schedule" size={12} color="#94a3b8" />
                          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.timeEstimate}</Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-primary">${(task.reward || 0).toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Enhanced Service with Supabase/S3 Integration
export const StorageService = {
  getUploadUrl: async (fileName: string, contentType: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('storage-manager', {
        body: {
          action: 'GET-UPLOAD-URL',
          bucket: 'xum-raw-submissions',
          fileName: `raw/${Date.now()}_${fileName}`,
          contentType
        }
      });
      if (error) throw error;
      return data.url;
    } catch (e) {
      console.error("S3 Handshake failed", e);
      return null;
    }
  },
  uploadToS3: async (url: string, blob: Blob) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type
        }
      });
      return response.ok;
    } catch (e) {
      console.error("Direct S3 transmission failed", e);
      return false;
    }
  }
};

// Dismissible Banner Component (Inline for simplicity)
const DismissibleStreakBanner = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000); // 10 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex-row items-center justify-between">
      <View className="flex-1 mr-4">
        <Text className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-1">Streak Bonus Active</Text>
        <Text className="text-slate-700 dark:text-slate-300 text-sm">Complete 5 tasks in a row to earn a <Text className="font-bold text-emerald-500">2x Multiplier</Text>.</Text>
      </View>
      <TouchableOpacity onPress={() => setVisible(false)} className="bg-emerald-500/20 p-2 rounded-full">
        <MaterialIcons name="close" size={16} color="#10b981" />
      </TouchableOpacity>
    </View>
  );
};

export const TaskDetailsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title="Mission Brief" onBack={() => onNavigate(ScreenName.TASK_MARKETPLACE)} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row items-center gap-3 mb-4 mt-6">
          <View className="px-3 py-1 bg-primary/10 rounded-full">
            <Text className="text-[10px] font-bold text-primary uppercase tracking-widest">Image Labelling</Text>
          </View>
          <View className="px-3 py-1 bg-emerald-500/10 rounded-full">
            <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">High Accuracy</Text>
          </View>
        </View>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Street Sign Labelling</Text>
        <View className="flex-row gap-4 mb-8">
          <Text className="font-bold text-primary">$0.50 Reward</Text>
          <Text className="font-bold text-slate-500">2m Est.</Text>
        </View>

        <View className="gap-6">
          <View>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Objective</Text>
            <Text className="text-slate-600 dark:text-slate-300 text-base">Ground AI navigation protocols by identifying and categorizing urban signage in complex street view captures.</Text>
            {/* Dismissible Banner */}
            <DismissibleStreakBanner />
          </View>
        </View>
        <View className="flex-row gap-4">

          <View className="flex-1 p-5 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Difficulty</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white uppercase">Easy</Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 border-t border-slate-200 dark:border-slate-800">
        <TouchableOpacity onPress={() => onNavigate(ScreenName.TEXT_INPUT_TASK)} className="w-full h-14 bg-primary rounded-2xl items-center justify-center">
          <Text className="text-white font-bold uppercase tracking-widest text-sm">Accept Protocol</Text>
        </TouchableOpacity>
      </View>
    </View >
  );
};

export const CaptureChoiceScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const choices = [
    { id: 'aud', title: 'Record Voice', desc: 'Audio linguistic grounding.', icon: 'mic', color: '#2563eb', screen: ScreenName.CAPTURE_AUDIO },
    { id: 'img', title: 'Capture Image', desc: 'Visual environment mapping.', icon: 'photo-camera', color: '#10b981', screen: ScreenName.MEDIA_CAPTURE },
    { id: 'vid', title: 'Record Video', desc: 'Temporal scene analysis.', icon: 'videocam', color: '#f43f5e', screen: ScreenName.CAPTURE_VIDEO },
    { id: 'txt', title: 'Write/Type Text', desc: 'Semantic text datasets.', icon: 'description', color: '#f97316', screen: ScreenName.TEXT_INPUT_TASK }
  ];

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title="Capture Data" onBack={() => onNavigate(ScreenName.HOME)} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Environmental{'\n'}Sensing</Text>
        <View className="gap-4">
          {choices.map((choice) => (
            <TouchableOpacity key={choice.id} onPress={() => onNavigate(choice.screen)} className="flex-row items-center p-6 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
              <View className="w-16 h-16 rounded-2xl items-center justify-center mr-5" style={{ backgroundColor: choice.color }}>
                <MaterialIcons name={choice.icon as any} size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 dark:text-white text-lg uppercase tracking-tight">{choice.title}</Text>
                <Text className="text-sm text-slate-500 mt-1">{choice.desc}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const CaptureVideoScreen: React.FC<any> = ({ onNavigate, onCompleteTask, route }) => {
  const { promptText, context } = route?.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isCustomEntry, setIsCustomEntry] = useState(false);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  const [description, setDescription] = useState(promptText || '');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<any>(null);

  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      setIsRecording(false);
      cameraRef.current.stopRecording();
    } else {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 30,
          quality: '720p',
        });

        // If custom entry or no prompt, go to review
        if (isCustomEntry || !promptText) {
          setReviewUri(video.uri);
          return;
        }

        setStatus('uploading');

        // Submit to backend
        await TaskService.submitPayload('video-capture', {
          type: 'video',
          uri: video.uri,
          s3_path: 'raw/video',
          description: promptText // Pass prompt as description
        }, 1.50, 40);

        setStatus('success');
        onCompleteTask?.(1.50, 40);
        setTimeout(() => onNavigate(ScreenName.TASK_SUCCESS), 1500);
      } catch (e) {
        console.error('Recording failed:', e);
        setIsRecording(false);
        Alert.alert('Error', 'Failed to record video. Please try again.');
      }
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-8">
        <MaterialIcons name="videocam-off" size={64} color="#94a3b8" />
        <Text className="text-white text-xl font-bold uppercase tracking-tight mt-6 mb-2 text-center">Camera Access Required</Text>
        <Text className="text-slate-500 text-center mb-8">XUM AI needs camera access to record video for AI training.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-primary px-8 py-4 rounded-2xl">
          <Text className="text-white font-bold uppercase tracking-widest">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="mt-4 p-4">
          <Text className="text-slate-500 font-bold uppercase tracking-widest text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // REVIEW UI (For Custom Tasks)
  if (reviewUri) {
    const handleSubmitCustom = async () => {
      if (!description) return;
      setStatus('uploading');
      try {
        await TaskService.submitPayload('video-capture', {
          type: 'video',
          uri: reviewUri,
          s3_path: 'raw/video',
          description: description
        }, 1.50, 40);
        setStatus('success');
        onCompleteTask?.(1.50, 40);
        setTimeout(() => onNavigate(ScreenName.TASK_SUCCESS), 1500);
      } catch (e) {
        console.error('Submission failed', e);
        Alert.alert('Error', 'Failed to submit video.');
        setStatus('idle');
      }
    };

    return (
      <View className="flex-1 bg-black">
        <View className="p-6 flex-row justify-between items-center absolute top-0 left-0 right-0 z-10">
          <TouchableOpacity onPress={() => setReviewUri(null)} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[10px] font-bold uppercase tracking-widest">Review Video</Text>
          <View className="w-12" />
        </View>

        {/* Placeholder for Video Player - Using a static image or icon since we can't easily inline a video player here without more imports */}
        <View className="flex-1 items-center justify-center bg-slate-900">
          <MaterialIcons name="play-circle-outline" size={80} color="white" />
          <Text className="text-slate-500 text-xs mt-4">Video Recorded</Text>
        </View>

        <View className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-black/80">
          <View className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-4">
            <Text className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Video Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What happens in this video?"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="w-full h-12 text-white font-bold text-lg"
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmitCustom}
            disabled={!description || status === 'uploading'}
            className={`w-full h-14 bg-primary rounded-2xl items-center justify-center ${!description ? 'opacity-50' : ''}`}
          >
            <Text className="text-white font-bold uppercase tracking-widest">
              {status === 'uploading' ? 'Uploading...' : 'Submit Video'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'uploading') {
    return (
      <View className="flex-1 bg-black items-center justify-center p-8">
        <View className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary mb-6" />
        <Text className="text-2xl font-bold text-white uppercase tracking-tight">Syncing Visuals</Text>
        <Text className="text-slate-500 text-sm mt-2">Transmitting to H-S3 Cluster...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="p-6 flex-row justify-between items-center absolute top-0 left-0 right-0 z-10">
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-[10px] font-bold uppercase tracking-widest">{context || 'Video Lab'}</Text>
        <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
          <MaterialIcons name="flip-camera-ios" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        mode="video"
      >
        {isRecording && (
          <View className="absolute top-20 left-0 right-0 items-center">
            <View className="flex-row items-center gap-2 bg-black/60 px-4 py-2 rounded-full">
              <View className="w-3 h-3 bg-red-500 rounded-full" />
              <Text className="text-white font-bold text-xs uppercase tracking-widest">Recording...</Text>
            </View>
            {promptText && (
              <View className="mt-4 bg-black/40 px-6 py-3 rounded-2xl max-w-[80%]">
                <Text className="text-white font-black text-2xl text-center leading-tight">"{promptText}"</Text>
              </View>
            )}
          </View>
        )}
      </CameraView>

      <View className="p-12 items-center absolute bottom-0 left-0 right-0">
        {(promptText && !isCustomEntry) ? (
          <View className="absolute bottom-32 bg-black/40 px-6 py-2 rounded-full">
            <Text className="text-white font-bold text-center mb-1">"{promptText}"</Text>
            <TouchableOpacity onPress={() => setIsCustomEntry(true)}>
              <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">Create Your Own</Text>
            </TouchableOpacity>
          </View>
        ) : (
          isCustomEntry && !isRecording && (
            <View className="absolute bottom-32 bg-black/40 px-6 py-2 rounded-full">
              <Text className="text-white font-bold text-center mb-1">Custom Mode</Text>
              <TouchableOpacity onPress={() => setIsCustomEntry(false)}>
                <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">Back to Prompt</Text>
              </TouchableOpacity>
            </View>
          )
        )}
        <TouchableOpacity onPress={handleRecord} className={`w-24 h-24 rounded-full border-4 p-1.5 ${isRecording ? 'border-red-500' : 'border-white'}`}>
          <View className={`flex-1 rounded-full ${isRecording ? 'bg-red-500 rounded-lg' : 'bg-white'}`} style={isRecording ? { transform: [{ scale: 0.6 }] } : undefined} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const MediaCaptureScreen: React.FC<any> = ({ onNavigate, onCompleteTask, route }) => {
  const { promptText, context } = route?.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCustomEntry, setIsCustomEntry] = useState(false);
  const [label, setLabel] = useState(promptText || '');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<any>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setCapturedImage(photo.uri);
    } catch (e) {
      console.error('Capture failed:', e);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!capturedImage || !label) return;

    setIsCapturing(true);
    try {
      await TaskService.submitPayload('image-capture', {
        type: 'image',
        label,
        uri: capturedImage,
        s3_path: 'raw/images'
      }, 0.50, 20);

      onCompleteTask?.(0.50, 20);
      onNavigate(ScreenName.TASK_SUCCESS);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit image. Please try again.');
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-8">
        <MaterialIcons name="photo-camera" size={64} color="#94a3b8" />
        <Text className="text-white text-xl font-bold uppercase tracking-tight mt-6 mb-2 text-center">Camera Access Required</Text>
        <Text className="text-slate-500 text-center mb-8">XUM AI needs camera access to capture images for AI training.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-primary px-8 py-4 rounded-2xl">
          <Text className="text-white font-bold uppercase tracking-widest">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="mt-4 p-4">
          <Text className="text-slate-500 font-bold uppercase tracking-widest text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <View className="flex-1 bg-black">
        <View className="p-6 flex-row justify-between items-center absolute top-0 left-0 right-0 z-10">
          <TouchableOpacity onPress={handleRetake} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
            <MaterialIcons name="refresh" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[10px] font-bold uppercase tracking-widest">Preview</Text>
          <View className="w-12" />
        </View>

        <Image source={{ uri: capturedImage }} style={{ flex: 1 }} resizeMode="contain" />

        <View className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-black/80">
          {(promptText && !isCustomEntry) ? (
            <View className="mb-6">
              <Text className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Verifying:</Text>
              <Text className="text-center text-xl font-bold text-white">"{promptText}"</Text>
              <TouchableOpacity onPress={() => setIsCustomEntry(true)} className="mt-3 bg-white/10 self-center px-4 py-2 rounded-full">
                <Text className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Create Your Own</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Capture Label</Text>
                {promptText && (
                  <TouchableOpacity onPress={() => setIsCustomEntry(false)}>
                    <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Back to Prompt</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="What did you capture?"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="w-full h-12 text-white font-bold text-lg"
              />
            </View>
          )}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!label || isCapturing}
            className={`w-full h-14 bg-primary rounded-2xl items-center justify-center ${!label || isCapturing ? 'opacity-50' : ''}`}
          >
            <Text className="text-white font-bold uppercase tracking-widest">
              {isCapturing ? 'Submitting...' : 'Submit Capture'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="p-6 flex-row justify-between items-center absolute top-0 left-0 right-0 z-10">
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-[10px] font-bold uppercase tracking-widest text-center">{context || 'Image Lab'}</Text>
          {promptText && <Text className="text-white font-bold text-sm text-center">"{promptText}"</Text>}
        </View>
        <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
          <MaterialIcons name="flip-camera-ios" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        {isCapturing && (
          <View className="absolute inset-0 bg-white/20 items-center justify-center">
            <View className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white" />
          </View>
        )}
      </CameraView>

      <View className="p-8 pb-12 items-center absolute bottom-0 left-0 right-0">
        <TouchableOpacity onPress={handleCapture} disabled={isCapturing} className={`w-24 h-24 rounded-full border-4 border-white p-1.5 ${isCapturing ? 'opacity-20' : ''}`}>
          <View className="flex-1 rounded-full bg-white" />
        </TouchableOpacity>
        
        {!isCapturing && (
          <TouchableOpacity 
            onPress={async () => {
              const result = await MediaCapture.pickImage();
              if (result.success && result.uri) {
                setCapturedImage(result.uri || null);
              } else if (result.error && result.error !== 'Selection cancelled') {
                Alert.alert('Error', result.error);
              }
            }}
            className="mt-6 flex-row items-center"
          >
            <MaterialIcons name="photo-library" size={20} color="white" />
            <Text className="text-white ml-2 font-bold uppercase tracking-widest text-[10px]">Upload from Gallery</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const CaptureAudioScreen: React.FC<any> = ({ onNavigate, onCompleteTask, route }) => {
  const { promptText, context } = route?.params || {};
  const [isRecording, setIsRecording] = useState(false);
  const [isCustomEntry, setIsCustomEntry] = useState(false);
  const [description, setDescription] = useState(promptText || '');
  const [status, setStatus] = useState<'idle' | 'transmitting'>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [audioBars, setAudioBars] = useState<number[]>(new Array(12).fill(10));
  const [permissionTimeout, setPermissionTimeout] = useState(false);

  // Timeout handler for stuck permission hook
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!permissionResponse) {
        setPermissionTimeout(true);
      }
    }, 3000); // 3 second timeout
    return () => clearTimeout(timer);
  }, [permissionResponse]);

  // Audio visualization effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioBars(prev => prev.map(() => Math.floor(Math.random() * 40) + 10));
      }, 100);
    } else {
      setAudioBars(new Array(12).fill(10));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSubmit = async () => {
    if (!recordingUri || !description) return;

    setStatus('transmitting');
    try {
      await TaskService.submitPayload('audio-capture', {
        type: 'audio',
        description,
        uri: recordingUri,
        s3_path: 'raw/audio'
      }, 1.00, 35);

      onCompleteTask?.(1.00, 35);
      onNavigate(ScreenName.TASK_SUCCESS);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit audio. Please try again.');
      setStatus('idle');
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  if (!permissionResponse && !permissionTimeout) {
    return (
      <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color="#1349ec" />
        <Text className="text-slate-500 mt-4">Loading permissions...</Text>
      </View>
    );
  }

  // Fallback if permission hook times out
  if (permissionTimeout && !permissionResponse) {
    return (
      <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center p-8">
        <MaterialIcons name="mic-off" size={64} color="#94a3b8" />
        <Text className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mt-6 mb-2 text-center">Microphone Access Needed</Text>
        <Text className="text-slate-500 text-center mb-8">Grant microphone access to record audio.</Text>
        <TouchableOpacity onPress={async () => {
          try {
            await requestPermission();
            setPermissionTimeout(false);
          } catch (e) {
            Alert.alert('Error', 'Failed to request permission. Please check your app settings.');
          }
        }} className="bg-primary px-8 py-4 rounded-2xl">
          <Text className="text-white font-bold uppercase tracking-widest">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="mt-4 p-4">
          <Text className="text-slate-500 font-bold uppercase tracking-widest text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permissionResponse.granted && !permissionResponse.canAskAgain) {
    return (
      <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center p-8">
        <MaterialIcons name="mic-off" size={64} color="#94a3b8" />
        <Text className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mt-6 mb-2 text-center">Microphone Access Required</Text>
        <Text className="text-slate-500 text-center mb-8">XUM AI needs microphone access to record audio for linguistic grounding.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-primary px-8 py-4 rounded-2xl">
          <Text className="text-white font-bold uppercase tracking-widest">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="mt-4 p-4">
          <Text className="text-slate-500 font-bold uppercase tracking-widest text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'transmitting') {
    return (
      <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center p-8">
        <View className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary mb-6" />
        <Text className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Transmitting Frequencies</Text>
        <Text className="text-slate-500 text-sm mt-2">Syncing with H-S3 Archive...</Text>
      </View>
    );
  }

  // Show submit UI if we have a recording
  if (recordingUri && !isRecording) {
    return (
      <View className="flex-1 bg-white dark:bg-background-dark">
        <Header title="Audio Captured" onBack={() => { setRecordingUri(null); }} />
        <View className="flex-1 p-6 items-center justify-center gap-8">
          <View className="w-32 h-32 rounded-full bg-emerald-500 items-center justify-center">
            <MaterialIcons name="check" size={60} color="white" />
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight text-center">Recording Complete</Text>

          <View className="w-full gap-4 mt-4">
            <View className="bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
              <Text className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Linguistic Context</Text>
              {(promptText && !isCustomEntry) ? (
                <View>
                  <Text className="text-slate-500 text-xs mb-1">Prompted Phrase:</Text>
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">"{promptText}"</Text>
                  <Text className="text-emerald-500 text-xs mt-2 font-bold">✓ Context Auto-Filled</Text>
                </View>
              ) : (
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what you recorded..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="w-full h-24 text-slate-900 dark:text-white"
                />
              )}
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!description}
              className={`w-full py-4 rounded-3xl items-center justify-center bg-primary ${!description ? 'opacity-20' : ''}`}
            >
              <Text className="text-white font-bold uppercase tracking-widest text-base">Submit Recording</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRecordingUri(null)}
              className="w-full h-12 items-center justify-center"
            >
              <Text className="text-slate-500 font-bold uppercase tracking-widest text-sm">Record Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title={context ? `${context} Collection` : "Audio Capture"} onBack={() => onNavigate(ScreenName.CAPTURE_CHOICE)} />

      {/* Guided Prompt Header */}
      {(promptText && !isCustomEntry) && (
        <View className="px-6 pt-6 pb-0 rounded-b-3xl items-center">
          <Text className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Please Say:</Text>
          <Text className="text-center text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4">"{promptText}"</Text>
          <TouchableOpacity onPress={() => setIsCustomEntry(true)} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Create Your Own</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCustomEntry && (
        <View className="px-6 pt-6 pb-0 rounded-b-3xl items-center">
          <Text className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Custom Task</Text>
          <Text className="text-center text-xl font-bold text-slate-900 dark:text-white mb-4">Record anything you want</Text>
          <TouchableOpacity onPress={() => setIsCustomEntry(false)} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Back to Prompt</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-1 p-6 items-center justify-center gap-12">
        <TouchableOpacity onPress={handleRecord} className="relative w-48 h-48 items-center justify-center">
          <View className={`absolute inset-0 rounded-full bg-primary/20 ${isRecording ? 'scale-150 opacity-0' : 'scale-100'}`} />
          <View className={`w-32 h-32 rounded-full items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-primary'}`}>
            <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={60} color="white" />
          </View>
        </TouchableOpacity>

        {/* Audio Visualizer */}
        <View className="flex-row items-end justify-center gap-1 h-12">
          {audioBars.map((h, i) => (
            <View
              key={i}
              className={`w-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </View>
        <View className="w-full">
          <Text className="text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </Text>
          
          {!isRecording && (
            <TouchableOpacity 
              onPress={async () => {
                const result = await MediaCapture.pickAudio();
                if (result.success && result.uri) {
                  setRecordingUri(result.uri || null);
                } else if (result.error && result.error !== 'Selection cancelled') {
                  Alert.alert('Error', result.error);
                }
              }}
              className="mt-6 flex-row items-center justify-center"
            >
              <MaterialIcons name="file-upload" size={20} color={theme.primary} />
              <Text className="ml-2 font-bold uppercase tracking-widest text-xs text-primary">Upload Audio File</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export const HybridCaptureScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [step, setStep] = useState<'video' | 'labeling'>('video');
  const [tags, setTags] = useState<string[]>([]);

  const handleNext = async () => {
    if (step === 'video') setStep('labeling');
    else {
      await TaskService.submitPayload('hybrid-task-id', { tags, description: 'Hybrid data' }, 2.50, 60);
      onCompleteTask?.(2.50, 60);
      onNavigate(ScreenName.TASK_SUCCESS);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <View className="p-6 flex-row justify-between items-center border-b border-white/5">
        <TouchableOpacity onPress={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
          <MaterialIcons name="close" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-[10px] font-bold uppercase tracking-widest">Hybrid Protocol</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {step === 'video' ? (
          <View className="p-6 items-center gap-8">
            <View className="w-full aspect-square rounded-3xl bg-white/5 border border-white/10 items-center justify-center overflow-hidden">
              <MaterialIcons name="videocam" size={80} color="rgba(255,255,255,0.1)" />
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white uppercase tracking-tighter mb-2">Capture Visuals</Text>
              <Text className="text-white/40 text-sm">Record a 10s clip of your current environment.</Text>
            </View>
          </View>
        ) : (
          <View className="p-6 gap-6">
            <View className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <Text className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Select Semantic Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {['Urban', 'Indoor', 'Speech', 'Crowded', 'Noisy', 'Nature', 'Traffic'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={`px-4 py-2 rounded-full ${tags.includes(t) ? 'bg-emerald-500' : 'bg-white/5 border border-white/10'}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${tags.includes(t) ? 'text-white' : 'text-white/40'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <Text className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Scene Description</Text>
              <TextInput placeholder="Describe the sequence..." placeholderTextColor="rgba(255,255,255,0.3)" multiline className="w-full h-24 text-white text-sm" />
            </View>
          </View>
        )}
      </ScrollView>

      <View className="p-6 pb-12 bg-slate-950/80 border-t border-white/5">
        <TouchableOpacity onPress={handleNext} className="w-full h-16 bg-white rounded-3xl items-center justify-center">
          <Text className="text-slate-950 font-bold uppercase tracking-widest text-sm">{step === 'video' ? 'Next: Labelling' : 'Seal Submission'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const TextInputTaskScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async () => {
    setStatus('submitting');
    try {
      await TaskService.submitPayload('mock-id-1', { response: value }, 0.50, 25);
      setStatus('success');
      onCompleteTask?.(0.50, 25);
      setTimeout(() => onNavigate(ScreenName.TASK_SUCCESS), 1500);
    } catch (e) {
      setStatus('idle');
      Alert.alert("Error", "Submission failed. Handshake interrupted.");
    }
  };

  if (status === 'submitting') {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center p-8">
        <View className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary mb-6" />
        <Text className="text-2xl font-bold text-white uppercase tracking-tight mb-2">Syncing Data</Text>
        <Text className="text-slate-500 text-sm mb-6">Uploading contribution to decentralized node...</Text>
        <TouchableOpacity onPress={() => setStatus('idle')} className="px-6 py-2 rounded-full border border-white/10 bg-white/5">
          <Text className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Cancel Mission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <Header title="Mission Execution" onBack={() => onNavigate(ScreenName.TASK_DETAILS)} />
      <View className="flex-1 p-6">
        <View className="bg-primary/10 rounded-3xl p-6 border border-primary/20 mb-8">
          <Text className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Prompt Protocol</Text>
          <Text className="text-slate-900 dark:text-white text-lg">"Identify and transcribe the text visible on the main billboard in this scene."</Text>
        </View>

        <View className="flex-1 gap-4">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contributor Input</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Enter transcription here..."
            placeholderTextColor="#94a3b8"
            multiline
            className="flex-1 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-6 text-lg text-slate-900 dark:text-white"
          />
        </View>

        <View className="pt-8">
          <TouchableOpacity
            disabled={!value}
            onPress={handleSubmit}
            className={`w-full h-16 bg-primary rounded-3xl items-center justify-center ${!value ? 'opacity-20' : ''}`}
          >
            <Text className="text-white font-bold uppercase tracking-wide text-sm">Submit Contribution</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const TaskSuccessScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <View className="flex-1 bg-white dark:bg-background-dark items-center justify-center p-8">
      <View className="w-40 h-40 rounded-full bg-emerald-500 items-center justify-center mb-8 shadow-lg">
        <MaterialIcons name="verified" size={80} color="white" />
      </View>
      <Text className="text-4xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter text-center mb-2">Contribution{'\n'}Validated</Text>
      <Text className="text-slate-500 text-sm mb-12 text-center max-w-xs">Handshake successful. Your accreditation is being processed by the network.</Text>

      <View className="flex-row gap-4 w-full max-w-sm mb-12">
        <View className="flex-1 p-6 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800 items-center">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accredited</Text>
          <Text className="text-2xl font-bold text-primary">+$0.50</Text>
        </View>
        <View className="flex-1 p-6 rounded-3xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800 items-center">

        </View>
      </View>

      <TouchableOpacity onPress={() => onNavigate(ScreenName.HOME)} className="w-full max-w-xs h-16 bg-primary rounded-3xl items-center justify-center">
        <Text className="text-white font-bold uppercase tracking-widest">Return to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export const LinguasenseScreen: React.FC<ScreenProps> = ({ onNavigate, session }) => {
  const { theme } = useTheme();

  const categories = [
    { id: 'l1', title: 'Grounding (H2D)', desc: 'Convert human dialects into machine intelligence.', icon: 'psychology', colors: ['#2563eb', '#4338ca'], count: 42 },
    { id: 'l2', title: 'Synthesis (D2H)', desc: 'Test AI comprehension of complex cultural cues.', icon: 'auto-awesome', colors: ['#7c3aed', '#db2777'], count: 18 },
    { id: 'l3', title: 'Audit Layer', desc: 'Identify and correct hallucinations in LLM outputs.', icon: 'security', colors: ['#059669', '#0d9488'], count: 31 },
  ];

  return (
    <View style={[linguaStyles.container, { backgroundColor: theme.background }]}>
      <Header
        title="LinguaSense Lab"
        onBack={() => onNavigate(ScreenName.HOME)}
      />

      <ScrollView
        style={linguaStyles.flex1}
        contentContainerStyle={linguaStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[`${theme.primary}20`, `${theme.primary}05`]}
          style={linguaStyles.heroCard}
        >
          <View style={linguaStyles.heroGlow}>
            <MaterialIcons name="hub" size={140} color={`${theme.primary}15`} />
          </View>
          <View style={linguaStyles.heroContent}>
            <Text style={[TEXT_STYLES.h3, { color: theme.text, marginBottom: SPACING.md }]}>
              Deep{'\n'}Language Lab
            </Text>
            <Text style={[TEXT_STYLES.bodySmall, { color: theme.textSecondary, maxWidth: '75%', lineHeight: 18 }]}>
              Bridges the gap between human culture and artificial reasoning through semantic grounding.
            </Text>
          </View>
        </LinearGradient>

        <View style={linguaStyles.sectionHeader}>
          <Text style={[linguaStyles.sectionTitle, { color: theme.textTertiary }]}>ACTIVE LAB CATEGORIES</Text>
        </View>

        {/* Categories Grid */}
        <View style={linguaStyles.list}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[linguaStyles.catCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => onNavigate(ScreenName.LANGUAGE_RUNNER)}
            >
              <View style={linguaStyles.catRow}>
                <LinearGradient
                  colors={cat.colors as [string, string]}
                  style={linguaStyles.catIconBox}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name={cat.icon as any} size={24} color="#fff" />
                </LinearGradient>
                <View style={linguaStyles.catInfo}>
                  <View style={linguaStyles.catHeader}>
                    <Text style={[TEXT_STYLES.label, { color: theme.text }]}>{cat.title}</Text>
                    <Text style={[TEXT_STYLES.caption, { color: theme.primary, fontWeight: '800' }]}>
                      {cat.count} TASKS
                    </Text>
                  </View>
                  <Text style={[TEXT_STYLES.caption, { color: theme.textSecondary, lineHeight: 14 }]} numberOfLines={2}>
                    {cat.desc}
                  </Text>
                </View>
              </View>
              <View style={linguaStyles.catFooter}>
                <Text style={[TEXT_STYLES.caption, { color: theme.textTertiary }]}>Estimated time: 2-5m</Text>
                <MaterialIcons name="chevron-right" size={18} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Stats */}
        <View style={linguaStyles.statsFooter}>
          <View style={linguaStyles.statRow}>
            <MaterialIcons name="verified-user" size={12} color={theme.textTertiary} />
            <Text style={[TEXT_STYLES.caption, { color: theme.textTertiary, marginLeft: 6 }]}>ENCRYPTION: AES-256</Text>
          </View>
          <View style={linguaStyles.statRow}>
            <MaterialIcons name="cloud-done" size={12} color={theme.textTertiary} />
            <Text style={[TEXT_STYLES.caption, { color: theme.textTertiary, marginLeft: 6 }]}>STATUS: 200 OK</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const linguaStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: LAYOUT.radius.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -10,
    right: -30,
    opacity: 0.8,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  list: {
    gap: SPACING.md,
  },
  catCard: {
    borderRadius: LAYOUT.radius.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  catIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catInfo: {
    flex: 1,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: SPACING.sm,
  },
  statsFooter: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    gap: 8,
    opacity: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export const LanguageTaskRunnerScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask, session }) => {
  const [textValue, setTextValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to submit.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('submissions').insert({
        task_id: 'ls_grounding_1',
        user_id: userId,
        submission_data: {
          task_type: 'linguasense',
          text_value: textValue,
          base_reward: 0.75,
          bonus_reward: 0,
          total_reward: 0.75,
        },
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
      onCompleteTask?.(0.75, 30);
      onNavigate(ScreenName.TASK_SUCCESS);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Grounding Engine" onBack={() => onNavigate(ScreenName.LINGUASENSE)} />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 24 }}>
        {/* Progress */}
        <View className="flex-row gap-1.5 mb-8">
          <View className="h-1 flex-1 bg-primary rounded-full" />
          <View className="h-1 flex-1 bg-slate-200 dark:bg-slate-900 rounded-full" />
          <View className="h-1 flex-1 bg-slate-200 dark:bg-slate-900 rounded-full" />
        </View>

        {/* Prompt */}
        <View className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-white/5 mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="bg-primary px-2 py-0.5 rounded">
              <Text className="text-[9px] font-bold text-white uppercase tracking-widest">Yoruba-Pidgin</Text>
            </View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Street commerce and fashion.</Text>
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-2xl">What is the local slang for "Fake/Imitation" in Lagos?</Text>
        </View>

        {/* Text Input */}
        <View className="bg-white dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-white/5 mb-6">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ground Truth Input</Text>
          <TextInput
            value={textValue}
            onChangeText={setTextValue}
            placeholder="Expose the cultural nuance here..."
            placeholderTextColor="#94a3b8"
            multiline
            className="w-full min-h-[100px] text-slate-900 dark:text-white font-bold text-xl"
          />
        </View>

        {/* Audio Recording */}
        <View className={`p-6 rounded-3xl border-2 flex-row items-center justify-between ${isRecording ? 'bg-red-500/5 border-red-500' : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5'}`}>
          <View className="flex-1">
            <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isRecording ? 'text-red-500' : 'text-primary'}`}>
              {isRecording ? 'Capturing Frequency...' : 'Audio Synthesis'}
            </Text>
            <View className="flex-row items-end gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <View key={i} className={`w-1 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ height: `${isRecording ? Math.random() * 40 + 10 : 10}%` }} />
              ))}
            </View>
          </View>
          <TouchableOpacity onPress={() => setIsRecording(!isRecording)} className={`w-20 h-20 rounded-2xl items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-slate-900 dark:bg-primary'}`}>
            <MaterialIcons name={isRecording ? 'stop-circle' : 'mic'} size={32} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="p-6 pb-12">
        <TouchableOpacity disabled={!textValue || isSubmitting} onPress={handleSubmit} className={`w-full h-16 bg-primary rounded-3xl items-center justify-center flex-row gap-3 ${(!textValue || isSubmitting) ? 'opacity-30' : ''}`}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-white font-bold uppercase tracking-wide text-sm">Finalize Synthesis</Text>
              <MaterialIcons name="psychology" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Placeholder screens
export const CreateTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Create" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center">
      <MaterialIcons name="construction" size={64} color="#94a3b8" />
      <Text className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-center px-12">Feature currently under scheduled maintenance</Text>
    </View>
  </View>
);

export const ValidationTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Validation" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center">
      <MaterialIcons name="pending-actions" size={64} color="#94a3b8" />
      <Text className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-center px-12">Validation services are currently processing backlog</Text>
    </View>
  </View>
);

export const TaskSubmissionScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Review" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center">
      <MaterialIcons name="update" size={64} color="#94a3b8" />
      <Text className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-center px-12">Submission review queue is full</Text>
    </View>
  </View>
);

export const XUMJudgeTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Judge" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center">
      <MaterialIcons name="gavel" size={64} color="#94a3b8" />
      <Text className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-center px-12">Judicial system offline for synchronization</Text>
    </View>
  </View>
);

export const RLHFCorrectionTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View className="flex-1 bg-white dark:bg-background-dark">
    <Header title="Correction" onBack={() => onNavigate(ScreenName.HOME)} />
    <View className="flex-1 items-center justify-center">
      <MaterialIcons name="edit-note" size={64} color="#94a3b8" />
      <Text className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-center px-12">Refining correction algorithms</Text>
    </View>
  </View>
);
