'use client';

/**
 * ✅ FIX #5: Migration Admin Page
 *
 * Bu sayfa sadece migration yapmak için - production'da bir kere çalıştırılmalı
 * URL: /admin/migrate
 */

import { useState } from 'react';
import { migrateSharedWithToIds, verifyMigration } from '@/lib/migrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle | running | success | error
  const [migrationResult, setMigrationResult] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleMigrate = async () => {
    setMigrationStatus('running');
    setMigrationResult(null);

    try {
      const result = await migrateSharedWithToIds();
      setMigrationResult(result);
      setMigrationStatus('success');
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResult({ error: error.message });
      setMigrationStatus('error');
    }
  };

  const handleVerify = async () => {
    setVerificationStatus('running');
    setVerificationResult(null);

    try {
      const result = await verifyMigration();
      setVerificationResult(result);
      setVerificationStatus(result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({ error: error.message });
      setVerificationStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Migration</h1>
          <p className="text-muted-foreground mt-2">
            Migrate board documents to add sharedUserIds field for query optimization
          </p>
        </div>

        {/* Migration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Run Migration</CardTitle>
            <CardDescription>
              This will add sharedUserIds field to all boards. Safe to run multiple times (idempotent).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleMigrate}
              disabled={migrationStatus === 'running'}
              size="lg"
            >
              {migrationStatus === 'running' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {migrationStatus === 'running' ? 'Migrating...' : 'Start Migration'}
            </Button>

            {migrationResult && (
              <div className="mt-4 p-4 rounded-lg border">
                {migrationStatus === 'success' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Migration Completed!</span>
                    </div>
                    <div className="text-sm space-y-1 mt-3">
                      <p>✅ Migrated: {migrationResult.migrated} boards</p>
                      <p>⏭️  Skipped: {migrationResult.skipped} boards (already migrated)</p>
                      <p>❌ Errors: {migrationResult.errors} boards</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span>Migration failed: {migrationResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Card */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Verify Migration</CardTitle>
            <CardDescription>
              Check that all boards have been successfully migrated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleVerify}
              disabled={verificationStatus === 'running'}
              variant="outline"
              size="lg"
            >
              {verificationStatus === 'running' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {verificationStatus === 'running' ? 'Verifying...' : 'Verify Migration'}
            </Button>

            {verificationResult && (
              <div className="mt-4 p-4 rounded-lg border">
                {verificationStatus === 'success' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">All Boards Verified!</span>
                    </div>
                    <div className="text-sm mt-3">
                      <p>✅ Valid boards: {verificationResult.valid}</p>
                    </div>
                  </div>
                ) : verificationResult.error ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span>Verification failed: {verificationResult.error}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Some Boards Need Migration</span>
                    </div>
                    <div className="text-sm space-y-1 mt-3">
                      <p>✅ Valid: {verificationResult.valid} boards</p>
                      <p>⚠️  Invalid: {verificationResult.invalid} boards</p>
                      {verificationResult.invalidBoards && (
                        <div className="mt-2">
                          <p className="font-semibold">Board IDs needing migration:</p>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                            {verificationResult.invalidBoards.join('\n')}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle>Migration Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Click "Start Migration" to add sharedUserIds to all boards</p>
            <p>2. Wait for migration to complete (check console for detailed logs)</p>
            <p>3. Click "Verify Migration" to ensure all boards were migrated</p>
            <p>4. If verification passes, the new query optimization is active!</p>
            <p className="text-muted-foreground mt-4">
              ⚠️ This page should be removed after migration or protected with admin authentication
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
