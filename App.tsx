import { StyleSheet } from "react-native";
import DiplomaGenerator from "./DiplomaGenerator";

export default function App() {
  return <DiplomaGenerator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
