import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { CameraView } from "expo-camera";
import * as FaceDetector from "expo-face-detector";
import { attendanceService } from "../services/attendanceService";
import { studentService } from "../services/studentService";
import { GlassmorphicButton } from "./GlassmorphicUI";

interface FaceRecognitionProps {
  studentId: string;
  mode: "enroll" | "verify";
  onSuccess?: (faceDescriptor: any) => void;
  sessionId?: string;
}

export const FaceRecognitionComponent: React.FC<FaceRecognitionProps> = ({
  studentId,
  mode,
  onSuccess,
  sessionId,
}) => {
  const cameraRef = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await CameraView.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  const handleFacesDetected = async ({ faces }: { faces: FaceDetector.Face[] }) => {
    if (faces.length === 0) {
      setFaceDetected(false);
      return;
    }

    setFaceDetected(true);

    if (isProcessing) return;

    const face = faces[0];
    const faceDescriptor = {
      bounds: face.bounds,
      landmarks: face.landmarks,
      leftEyeOpen: face.leftEyeOpenProbability,
      rightEyeOpen: face.rightEyeOpenProbability,
      smilingProbability: face.smilingProbability,
    };

    setIsProcessing(true);

    try {
      if (mode === "enroll") {
        await studentService.enrollFace(studentId, faceDescriptor);
        Alert.alert("Success", "Face enrolled successfully!");
        onSuccess?.(faceDescriptor);
      } else if (mode === "verify" && sessionId) {
        await attendanceService.markAttendance(sessionId, studentId, faceDescriptor);
        Alert.alert("Success", "Attendance marked successfully!");
        onSuccess?.(faceDescriptor);
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Face recognition failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasCameraPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-900 p-4">
        <Text className="text-white text-center mb-4">Camera permission is required</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 relative">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
        }}
      />

      {/* Overlay */}
      <View className="absolute inset-0 justify-center items-center">
        <View
          className={`w-64 h-80 rounded-3xl border-4 ${
            faceDetected ? "border-green-500" : "border-gray-500"
          }`}
        />
      </View>

      {/* Status */}
      <View className="absolute bottom-0 left-0 right-0 bg-dark-900/80 backdrop-blur p-6">
        <Text className={`text-center font-bold text-lg mb-4 ${faceDetected ? "text-green-500" : "text-yellow-500"}`}>
          {faceDetected ? "Face Detected ✓" : "Position your face in the frame"}
        </Text>
        <GlassmorphicButton title="Cancel" onPress={() => onSuccess?.(null)} />
      </View>
    </View>
  );
};
