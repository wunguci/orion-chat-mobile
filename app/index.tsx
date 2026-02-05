import { Redirect } from "expo-router";
import { useEffect } from "react";

// Redirect to tabs by default
export default function Index() {
  useEffect(() => {
    console.log("App Index loaded");
  }, []);

  return <Redirect href="/(tabs)" />;
}
