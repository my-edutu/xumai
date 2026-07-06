import './global.css';
import './web-shell.css'; // Web-only app shell (compiled out on native, like global.css)
import { registerRootComponent } from 'expo';

import * as WebBrowser from 'expo-web-browser';
import App from './src/App';

// Complete auth session if we're returning from a redirect
WebBrowser.maybeCompleteAuthSession();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

/* 
  ⚠️ SERVER-SIDE DATABASE CODE (Reference Only) 
  The following code was requested for this file but CANNOT run in the mobile app client.
  It requires Node.js `net` and `tls` modules which are not available in Expo/React Native.
  
  To run this logic, verify 'scripts/test-db-connection.ts' effectively does this:

  import { drizzle } from 'drizzle-orm/postgres-js'
  import postgres from 'postgres'
  import { users } from './drizzle/schema'

  const connectionString = process.env.DATABASE_URL
  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client);

  const allUsers = await db.select().from(users);
*/