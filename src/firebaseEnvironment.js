export const productionProjectId = 'pharma-apps';
export const testProjectId = 'demo-roshita-f02';

function emulatorEndpoint(env, key, defaultPort) {
  const host = env[`VITE_FIREBASE_${key}_EMULATOR_HOST`] || '127.0.0.1';
  const port = Number(env[`VITE_FIREBASE_${key}_EMULATOR_PORT`] || defaultPort);
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid local Firebase Emulator endpoint: ${key}.`);
  }
  return Object.freeze({host, port});
}

export function resolveFirebaseEnvironment(env = {}, mode = 'production') {
  const useEmulators = env.VITE_FIREBASE_USE_EMULATORS === 'true';
  const projectId = env.VITE_FIREBASE_PROJECT_ID ||
    (useEmulators ? testProjectId : productionProjectId);

  const testMode = mode === 'test' || useEmulators;
  if (testMode && !useEmulators) {
    throw new Error('Test mode requires VITE_FIREBASE_USE_EMULATORS=true.');
  }
  if (useEmulators &&
      (projectId === productionProjectId || !projectId.startsWith('demo-'))) {
    throw new Error(`Refusing non-demo Firebase project: ${projectId}`);
  }

  return Object.freeze({
    projectId,
    useEmulators,
    hosts: Object.freeze({
      auth: emulatorEndpoint(env, 'AUTH', 9099),
      firestore: emulatorEndpoint(env, 'FIRESTORE', 8080),
      functions: emulatorEndpoint(env, 'FUNCTIONS', 5001),
      storage: emulatorEndpoint(env, 'STORAGE', 9199),
    }),
  });
}
