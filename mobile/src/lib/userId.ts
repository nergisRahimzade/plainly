import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "plainly_user_id";

function randomId(): string {
  return "xxxxxxxxyxxxxxxxxxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedId: string | null = null;

export async function getUserId(): Promise<string> {
  if (cachedId) return cachedId;
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = randomId();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  cachedId = id;
  return id;
}
