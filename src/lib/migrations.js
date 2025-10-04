/**
 * ✅ FIX #5: Migration script - sharedWith array'inden sharedUserIds field'ı oluştur
 *
 * Bu script bir kere çalıştırılmalı (production'da manuel veya deployment sırasında)
 * Mevcut tüm board'lara sharedUserIds field'ı ekler
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const BOARDS_COLLECTION = 'boards';

/**
 * Migrate all boards to add sharedUserIds field
 * Bu fonksiyon idempotent - birden fazla çalıştırılabilir (safe)
 */
export async function migrateSharedWithToIds() {
  try {
    console.log('🔄 Starting migration: sharedWith -> sharedUserIds');

    const boardsSnapshot = await getDocs(collection(db, BOARDS_COLLECTION));
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const boardDoc of boardsSnapshot.docs) {
      try {
        const board = boardDoc.data();

        // Zaten sharedUserIds varsa skip (idempotent)
        if (board.sharedUserIds && Array.isArray(board.sharedUserIds)) {
          console.log(`⏭️  Skipping board ${boardDoc.id} - already has sharedUserIds`);
          skippedCount++;
          continue;
        }

        // sharedWith array'inden user ID'leri çıkar
        const sharedUserIds = (board.sharedWith || [])
          .map(share => share.userId)
          .filter(Boolean); // null/undefined'ları filtrele

        // Board'u güncelle
        await updateDoc(doc(db, BOARDS_COLLECTION, boardDoc.id), {
          sharedUserIds: sharedUserIds
        });

        console.log(`✅ Migrated board ${boardDoc.id} - ${sharedUserIds.length} shared users`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating board ${boardDoc.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} boards`);
    console.log(`   ⏭️  Skipped: ${skippedCount} boards (already migrated)`);
    console.log(`   ❌ Errors: ${errorCount} boards`);
    console.log('✨ Migration complete!\n');

    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration - kontrol et ki tüm board'lar migrate edilmiş
 */
export async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration...');

    const boardsSnapshot = await getDocs(collection(db, BOARDS_COLLECTION));
    let validCount = 0;
    let invalidBoards = [];

    for (const boardDoc of boardsSnapshot.docs) {
      const board = boardDoc.data();

      // sharedUserIds field'ı var mı?
      if (!board.sharedUserIds || !Array.isArray(board.sharedUserIds)) {
        invalidBoards.push(boardDoc.id);
      } else {
        validCount++;
      }
    }

    if (invalidBoards.length === 0) {
      console.log(`✅ All ${validCount} boards have sharedUserIds field`);
      return { success: true, valid: validCount, invalid: 0 };
    } else {
      console.warn(`⚠️  ${invalidBoards.length} boards missing sharedUserIds field:`);
      console.warn(invalidBoards.join(', '));
      return { success: false, valid: validCount, invalid: invalidBoards.length, invalidBoards };
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}
