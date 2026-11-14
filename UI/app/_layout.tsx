import { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { Animated, StyleSheet, View } from "react-native";

import { PawPlateProvider } from "../state/PawPlateContext";

const loadingVideo = require("../assets/images/pawplate_loading_screen.mp4");

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const hasHiddenLoading = useRef(false);
  const player = useVideoPlayer(loadingVideo, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    const hideLoading = () => {
      if (hasHiddenLoading.current) {
        return;
      }

      hasHiddenLoading.current = true;
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setIsLoading(false));
    };

    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    const playbackSubscription = player.addListener("playToEnd", hideLoading);
    const fallbackTimer = setTimeout(hideLoading, 4500);

    return () => {
      playbackSubscription.remove();
      clearTimeout(fallbackTimer);
    };
  }, [opacity, player]);

  return (
    <View style={styles.container}>
      <PawPlateProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </PawPlateProvider>

      {isLoading ? (
        <Animated.View style={[styles.loadingScreen, { opacity }]}>
          <VideoView
            player={player}
            style={styles.loadingVideo}
            contentFit="cover"
            nativeControls={false}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingScreen: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: "#fbf7ef",
  },
  loadingVideo: {
    width: "100%",
    height: "100%",
  },
});
