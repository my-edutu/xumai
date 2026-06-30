import './global.css';
import React from 'react';
import { registerRootComponent } from 'expo';

import * as WebBrowser from 'expo-web-browser';
import App from './src/App';
import { LinguaLinkLanding } from './src/pages/LinguaLinkLanding';

// Complete auth session if we're returning from a redirect
WebBrowser.maybeCompleteAuthSession();

function Root() {
  // On web, check if we're on the LinguaLink landing page
  if (typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/lingualink') {
    return <LinguaLinkLanding />;
  }
  return <App />;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);

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