import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface CloudRestorePayload {
  config?: any;
  flats?: any[];
  members?: any[];
  payments?: any[];
  expenses?: any[];
  notices?: any[];
  visitors?: any[];
  complaints?: any[];
  staff?: any[];
  activityLogs?: any[];
}

/**
 * Backup all local storage data collections into the authenticated Firestore database
 */
export async function backupToFirestoreCloud(payload: CloudRestorePayload): Promise<{ success: boolean; count: number }> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to backup to Firestore Cloud.');
  }

  let totalDocumentsSaved = 0;

  // 1. Save Config
  if (payload.config) {
    await setDoc(doc(db, 'config', 'latest'), payload.config);
    totalDocumentsSaved++;
  }

  // Helper to write items in collections safely
  const saveCollectionItems = async (colName: string, items?: any[]) => {
    if (!items || items.length === 0) return;
    
    // To be efficient, we can use Firestore write batches (capped at 500 items per batch)
    // Since our database averages 72 flats, up to < 200 elements, safe and fast
    let batch = writeBatch(db);
    let batchCounter = 0;

    for (const item of items) {
      if (!item.id) continue;
      
      const docRef = doc(db, colName, item.id);
      batch.set(docRef, item);
      batchCounter++;
      totalDocumentsSaved++;

      if (batchCounter === 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchCounter = 0;
      }
    }
    
    if (batchCounter > 0) {
      await batch.commit();
    }
  };

  // Perform sequential backups of entities
  await saveCollectionItems('flats', payload.flats);
  await saveCollectionItems('members', payload.members);
  await saveCollectionItems('payments', payload.payments);
  await saveCollectionItems('expenses', payload.expenses);
  await saveCollectionItems('notices', payload.notices);
  await saveCollectionItems('visitors', payload.visitors);
  await saveCollectionItems('complaints', payload.complaints);
  await saveCollectionItems('staff', payload.staff);
  await saveCollectionItems('activityLogs', payload.activityLogs);

  return { success: true, count: totalDocumentsSaved };
}

/**
 * Restore complete society state structure by downloading records from active Firestore Cloud collections
 */
export async function restoreFromFirestoreCloud(): Promise<CloudRestorePayload> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to restore from Firestore Cloud.');
  }

  const payload: CloudRestorePayload = {};

  // 1. Read Config
  try {
    const configSnap = await getDoc(doc(db, 'config', 'latest'));
    if (configSnap.exists()) {
      payload.config = configSnap.data();
    }
  } catch (error) {
    console.warn("No active remote config document found or read access blocked.");
  }

  // Helper to load collection items
  const loadCollectionItems = async (colName: string): Promise<any[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      return list;
    } catch (e) {
      console.warn(`Could not fetch Firestore collection: ${colName}. Active scope rules may require Admin roles.`, e);
      return [];
    }
  };

  // Pull individual tables
  payload.flats = await loadCollectionItems('flats');
  payload.members = await loadCollectionItems('members');
  payload.payments = await loadCollectionItems('payments');
  payload.expenses = await loadCollectionItems('expenses');
  payload.notices = await loadCollectionItems('notices');
  payload.visitors = await loadCollectionItems('visitors');
  payload.complaints = await loadCollectionItems('complaints');
  payload.staff = await loadCollectionItems('staff');
  payload.activityLogs = await loadCollectionItems('activityLogs');

  return payload;
}
