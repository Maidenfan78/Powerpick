import React, { useState } from "react";
import { View, Alert, StyleSheet, Text } from "react-native";
import { supabase } from "../lib/supabase";
import { TextInput, Button } from "react-native-paper";

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 16 },
  signIn: { marginBottom: 8 },
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUp() {
    setLoading(true);
    const { data: { session } = {}, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) Alert.alert(error.message);
    else if (!session) Alert.alert("Check your inbox to verify your email");
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={signIn}
        loading={loading}
        style={styles.signIn}
      >
        <Text>Sign In</Text>
      </Button>
      <Button mode="outlined" onPress={signUp} loading={loading}>
        <Text>Sign Up</Text>
      </Button>
    </View>
  );
}
