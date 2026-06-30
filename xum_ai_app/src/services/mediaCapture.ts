/**
 * XUM AI - Media Capture Service
 * 
 * Handles audio recording, image capture, and video recording using Expo APIs.
 * Provides a unified interface for all media capture operations.
 */

import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
function getFileSystem() {
    return require('expo-file-system/legacy');
}

// ============================================================================
// TYPES
// ============================================================================

export interface CaptureResult {
    success: boolean;
    uri?: string;
    duration?: number;
    size?: number;
    error?: string;
}

export interface PermissionResult {
    granted: boolean;
    canAskAgain: boolean;
}

// ============================================================================
// AUDIO RECORDING (using expo-av)
// ============================================================================

let audioRecordingStartTime: number | null = null;

/**
 * Request microphone permission
 */
export async function requestAudioPermission(): Promise<PermissionResult> {
    try {
        const status = await Audio.requestPermissionsAsync();
        return { granted: status.granted, canAskAgain: status.canAskAgain };
    } catch (err) {
        console.error('[Audio] Permission error:', err);
        return { granted: false, canAskAgain: true };
    }
}

// Create a module-level recorder reference placeholder
let activeRecorderRef: Audio.Recording | null = null;

/**
 * Start audio recording (returns a function to stop)
 */
export async function startAudioRecording(recorderRef?: Audio.Recording): Promise<boolean> {
    try {
        // Request permission first
        const permission = await requestAudioPermission();
        if (!permission.granted) {
            console.warn('[Audio] Permission not granted');
            return false;
        }

        if (recorderRef) {
            activeRecorderRef = recorderRef;
            await recorderRef.startAsync();
            audioRecordingStartTime = Date.now();
            console.log('[Audio] Recording started');
            return true;
        }

        console.warn('[Audio] No recorder reference provided');
        return false;
    } catch (err) {
        console.error('[Audio] Start recording error:', err);
        return false;
    }
}

/**
 * Stop audio recording and return the file URI
 */
export async function stopAudioRecording(recorderRef?: Audio.Recording): Promise<CaptureResult> {
    try {
        const recorder: Audio.Recording | null = recorderRef || activeRecorderRef;
        if (!recorder) {
            return { success: false, error: 'No active recording' };
        }

        // Stop recording
        const finalStatus = await recorder.stopAndUnloadAsync();
        const uri = recorder.getURI();
        const duration = finalStatus.durationMillis ? Math.round(finalStatus.durationMillis / 1000) : 0;

        audioRecordingStartTime = null;
        activeRecorderRef = null;

        if (!uri) {
            return { success: false, error: 'No recording URI' };
        }

        // Get file size
        const FileSystem = getFileSystem();
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const size = fileInfo.exists ? (fileInfo as any).size : 0;

        console.log('[Audio] Recording stopped:', uri);
        return {
            success: true,
            uri,
            duration,
            size,
        };
    } catch (err: any) {
        console.error('[Audio] Stop recording error:', err);
        return { success: false, error: err.message || 'Failed to stop recording' };
    }
}

/**
 * Cancel active recording
 */
export async function cancelAudioRecording(recorderRef?: Audio.Recording): Promise<void> {
    try {
        const recorder: Audio.Recording | null = recorderRef || activeRecorderRef;
        if (recorder) {
            await recorder.stopAndUnloadAsync();
        }
        audioRecordingStartTime = null;
        activeRecorderRef = null;
    } catch (err) {
        console.error('[Audio] Cancel recording error:', err);
    }
}

/**
 * Pick audio from files
 */
export async function pickAudio(): Promise<CaptureResult> {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, error: 'Selection cancelled' };
        }

        const asset = result.assets[0];
        const FileSystem = getFileSystem();
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = fileInfo.exists ? (fileInfo as any).size : 0;

        return {
            success: true,
            uri: asset.uri,
            size,
            // Duration is not easily available from document picker without more heavy lifting
            duration: 0,
        };
    } catch (err: any) {
        console.error('[Audio] Pick error:', err);
        return { success: false, error: err.message || 'Failed to pick audio' };
    }
}

// ============================================================================
// IMAGE CAPTURE
// ============================================================================

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<PermissionResult> {
    try {
        const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
        return { granted: status === 'granted', canAskAgain };
    } catch (err) {
        console.error('[Camera] Permission error:', err);
        return { granted: false, canAskAgain: true };
    }
}

/**
 * Capture image using camera
 */
export async function captureImage(): Promise<CaptureResult> {
    try {
        // Request permission
        const permission = await requestCameraPermission();
        if (!permission.granted) {
            return { success: false, error: 'Camera permission not granted' };
        }

        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
            exif: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, error: 'Capture cancelled' };
        }

        const asset = result.assets[0];

        // Get file size
        const FileSystem = getFileSystem();
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = fileInfo.exists ? (fileInfo as any).size : 0;

        return {
            success: true,
            uri: asset.uri,
            size,
        };
    } catch (err: any) {
        console.error('[Camera] Capture error:', err);
        return { success: false, error: err.message || 'Failed to capture image' };
    }
}

/**
 * Pick image from gallery
 */
export async function pickImage(): Promise<CaptureResult> {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, error: 'Selection cancelled' };
        }

        const asset = result.assets[0];

        // Get file size
        const FileSystem = getFileSystem();
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = fileInfo.exists ? (fileInfo as any).size : 0;

        return {
            success: true,
            uri: asset.uri,
            size,
        };
    } catch (err: any) {
        console.error('[Gallery] Pick error:', err);
        return { success: false, error: err.message || 'Failed to pick image' };
    }
}

// ============================================================================
// VIDEO RECORDING
// ============================================================================

/**
 * Capture video using camera
 */
export async function captureVideo(maxDuration: number = 15): Promise<CaptureResult> {
    try {
        // Request camera and microphone permissions
        const cameraPermission = await requestCameraPermission();
        const audioPermission = await requestAudioPermission();

        if (!cameraPermission.granted || !audioPermission.granted) {
            return { success: false, error: 'Camera and microphone permissions required' };
        }

        // Launch video capture
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos'],
            videoMaxDuration: maxDuration,
            quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, error: 'Recording cancelled' };
        }

        const asset = result.assets[0];

        // Get file size
        const FileSystem = getFileSystem();
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = fileInfo.exists ? (fileInfo as any).size : 0;

        return {
            success: true,
            uri: asset.uri,
            duration: asset.duration ? Math.round(asset.duration) : 0,
            size,
        };
    } catch (err: any) {
        console.error('[Video] Capture error:', err);
        return { success: false, error: err.message || 'Failed to capture video' };
    }
}

/**
 * Pick video from gallery
 */
export async function pickVideo(): Promise<CaptureResult> {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, error: 'Selection cancelled' };
        }

        const asset = result.assets[0];

        // Get file size
        const FileSystem = getFileSystem();
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const size = fileInfo.exists ? (fileInfo as any).size : 0;

        return {
            success: true,
            uri: asset.uri,
            duration: asset.duration ? Math.round(asset.duration) : 0,
            size,
        };
    } catch (err: any) {
        console.error('[Video] Pick error:', err);
        return { success: false, error: err.message || 'Failed to pick video' };
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get file extension from URI
 */
export function getFileExtension(uri: string): string {
    const parts = uri.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Format duration to MM:SS
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const MediaCapture = {
    // Audio
    requestAudioPermission,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
    pickAudio,

    // Image
    requestCameraPermission,
    captureImage,
    pickImage,

    // Video
    captureVideo,
    pickVideo,

    // Utilities
    getFileExtension,
    formatDuration,
    formatFileSize,
};

export default MediaCapture;
