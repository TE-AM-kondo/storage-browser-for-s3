"use client";

import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-storage/storage-browser-styles.css";
import { Authenticator, Button } from "@aws-amplify/ui-react";
import { StorageBrowser } from "@aws-amplify/ui-react-storage";
import { configureAmplify } from "@/config/amplify";

configureAmplify();

export default function App() {
  return (
    <Authenticator>
      {({ signOut }) => (
        <>
          <Button onClick={signOut}>Sign Out</Button>
          <StorageBrowser />
        </>
      )}
    </Authenticator>
  );
}
