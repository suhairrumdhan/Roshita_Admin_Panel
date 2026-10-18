import { describe, expect, it } from 'vitest';
import { productionProjectId, resolveFirebaseEnvironment, testProjectId } from './firebaseEnvironment';

describe('Firebase test isolation', () => {
  it('rejects test mode without explicit emulator routing', () => {
    expect(() => resolveFirebaseEnvironment({}, 'test')).toThrow('Test mode requires VITE_FIREBASE_USE_EMULATORS=true.');
  });

  it('rejects production project IDs while emulators are enabled', () => {
    expect(() => resolveFirebaseEnvironment({VITE_FIREBASE_USE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: productionProjectId}, 'test')).toThrow('Refusing non-demo Firebase project');
  });

  it('uses the reviewed demo project and default loopback emulator ports', () => {
    const runtime = resolveFirebaseEnvironment({VITE_FIREBASE_USE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: testProjectId}, 'test');
    expect(runtime.projectId).toBe(testProjectId);
    expect(runtime.hosts.firestore).toEqual({host: '127.0.0.1', port: 8080});
    expect(runtime.hosts.functions.port).toBe(5001);
  });

  it('allows isolated loopback ports without changing project isolation', () => {
    const runtime = resolveFirebaseEnvironment({VITE_FIREBASE_USE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-roshita-admin-nf', VITE_FIREBASE_AUTH_EMULATOR_PORT: '19099',
      VITE_FIREBASE_FIRESTORE_EMULATOR_PORT: '18080', VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT: '15001',
      VITE_FIREBASE_STORAGE_EMULATOR_PORT: '19199'}, 'development');
    expect(runtime.hosts).toEqual({auth: {host: '127.0.0.1', port: 19099},
      firestore: {host: '127.0.0.1', port: 18080}, functions: {host: '127.0.0.1', port: 15001},
      storage: {host: '127.0.0.1', port: 19199}});
  });

  it('rejects non-loopback endpoints for emulator mode', () => {
    expect(() => resolveFirebaseEnvironment({VITE_FIREBASE_USE_EMULATORS: 'true',
      VITE_FIREBASE_AUTH_EMULATOR_HOST: 'example.com'})).toThrow('Invalid local Firebase Emulator endpoint');
  });
});
