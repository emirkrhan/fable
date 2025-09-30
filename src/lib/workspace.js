import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'workspaces';
const STORAGE_KEY = 'story-planner:flow:v1';

// Function to remove undefined values from objects recursively
function cleanUndefinedValues(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function saveWorkspaceToFirebase(userId, workspaceData) {
  try {
    // Clean undefined values before saving
    const cleanedData = cleanUndefinedValues({
      ...workspaceData,
      updatedAt: new Date().toISOString(),
    });

    const workspaceRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(workspaceRef, cleanedData);
    console.log('Workspace saved to Firebase');
    return true;
  } catch (error) {
    console.error('Error saving workspace to Firebase:', error);
    return false;
  }
}

export async function loadWorkspaceFromFirebase(userId) {
  try {
    const workspaceRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(workspaceRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Workspace loaded from Firebase');
      return data;
    } else {
      console.log('No workspace found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('Error loading workspace from Firebase:', error);
    return null;
  }
}

export function saveWorkspaceToLocalStorage(workspaceData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...workspaceData,
      savedAt: new Date().toISOString(),
    }));
    console.log('Workspace saved to localStorage');
    return true;
  } catch (error) {
    console.error('Error saving workspace to localStorage:', error);
    return false;
  }
}

export function loadWorkspaceFromLocalStorage() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      console.log('Workspace loaded from localStorage');
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error loading workspace from localStorage:', error);
    return null;
  }
}