"use client";

import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-storage/storage-browser-styles.css";
import outputs from "@/amplify_outputs.json";
import { Authenticator, Button } from "@aws-amplify/ui-react";
import { StorageBrowser } from "@aws-amplify/ui-react-storage";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);

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
