/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
// Add the requested Google Drive scope
provider.addScope('https://www.googleapis.com/auth/drive.file');

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

// Global cached in-memory access token to prevent repetitive sign-ins
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Set manual access token for environments like GitHub Pages where popup sign-in gets blocked or restricted.
 */
export const setManualAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem('google_drive_manual_access_token', token);
  } else {
    localStorage.removeItem('google_drive_manual_access_token');
  }
};

/**
 * Trigger Google Sign In and return the access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      throw new Error('Failed to obtain Google OAuth access token.');
    }
    cachedAccessToken = accessToken;
    localStorage.setItem('google_drive_manual_access_token', accessToken);
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get active cached access token or return null if not logged in
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem('google_drive_manual_access_token');
};

/**
 * Clear token cache on logout
 */
export const logoutGoogle = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn("Firebase Auth signOut warning:", e);
  }
  cachedAccessToken = null;
  localStorage.removeItem('google_drive_manual_access_token');
};

/**
 * Upload backup payload to Google Drive using standard multipart upload (v3)
 */
export const uploadBackupToDrive = async (
  accessToken: string,
  jsonData: string,
  customName?: string
): Promise<any> => {
  const timestamp = new Date().toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
  
  const fileName = customName || `astha-twin-towers-backup-${timestamp}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Astha Twin Towers Society Database Backup Auto-Save Schema',
  };

  const boundary = 'astha_twin_towers_backup_boundary';
  
  // Construct the multipart body safely
  const multipartBody = 
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonData}\r\n` +
    `--${boundary}--`;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive upload failed: ${response.status} - ${errText}`);
  }

  return response.json();
};

/**
 * Retrieve list of JSON backup files from the user's Google Drive matching the filter query
 */
export const listDriveBackups = async (accessToken: string): Promise<DriveBackupFile[]> => {
  const query = "name contains 'astha-twin-towers-backup' and mimeType = 'application/json' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive listing failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Fetch the exact payload content of a given file ID from Google Drive
 */
export const downloadBackupFromDrive = async (accessToken: string, fileId: string): Promise<string> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive download failed: ${response.status} - ${errText}`);
  }

  return response.text();
};

/**
 * Delete a backup file from Google Drive (requires user confirmation in UI)
 */
export const deleteBackupFromDrive = async (accessToken: string, fileId: string): Promise<boolean> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive delete failed: ${response.status} - ${errText}`);
  }

  return true;
};
