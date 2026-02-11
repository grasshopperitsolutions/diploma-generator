import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Types
interface CertificateData {
  recipientName: string;
  courseName: string;
  date: string;
  issuerSignature: string;
  logo: string | null;
  id?: string;
  timestamp?: string;
}

interface ValidationResult {
  status: "valid" | "invalid";
  data?: CertificateData;
}

type TabType = "generate" | "validate";

// Helper Functions
const generateId = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += "-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const formatDate = (dateString: string): string => {
  if (!dateString)
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Diploma Component
interface DiplomaProps {
  data: CertificateData;
  isPreview?: boolean;
}

const Diploma: React.FC<DiplomaProps> = ({ data, isPreview = false }) => {
  const scale = 0.45; // Scale factor for mobile display

  return (
    <View style={[styles.diplomaContainer, { transform: [{ scale }] }]}>
      {/* Decorative Borders */}
      <View style={styles.borderOuter} />
      <View style={styles.borderInner} />

      {/* Corner Ornaments */}
      <View style={[styles.cornerOrnament, styles.cornerTopLeft]} />
      <View style={[styles.cornerOrnament, styles.cornerTopRight]} />
      <View style={[styles.cornerOrnament, styles.cornerBottomLeft]} />
      <View style={[styles.cornerOrnament, styles.cornerBottomRight]} />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Top Section - Logo & Header */}
        <View style={styles.headerSection}>
          {data.logo ? (
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: data.logo }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Ionicons
              name="trophy"
              size={96}
              color="#D4AF37"
              style={{ opacity: 0.8 }}
            />
          )}

          <Text style={styles.titleText}>CERTIFICATE</Text>
          <Text style={styles.subtitleText}>OF COMPLETION</Text>
          <View style={styles.divider} />
        </View>

        {/* Middle Section - Recipient & Course */}
        <View style={styles.middleSection}>
          <Text style={styles.presentedToText}>
            THIS CERTIFICATE IS PRESENTED TO
          </Text>

          <View style={styles.recipientContainer}>
            <Text style={styles.recipientName}>
              {data.recipientName || "Recipient Name"}
            </Text>
          </View>
          <View style={styles.underline} />

          <Text style={styles.completionText}>
            For the successful completion of
          </Text>

          <Text style={styles.courseTitle}>
            {data.courseName || "Course Title Here"}
          </Text>
        </View>

        {/* Bottom Section - Signatures & Seal */}
        <View style={styles.bottomSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureText}>{formatDate(data.date)}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>DATE ISSUED</Text>
            </View>

            <View style={styles.signatureBlock}>
              <Text style={styles.signatureText}>
                {data.issuerSignature || "Signature"}
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>AUTHORIZED SIGNATURE</Text>
            </View>
          </View>

          {/* Gold Seal */}
          <View style={styles.sealContainer}>
            <View style={styles.seal}>
              <Ionicons name="shield-checkmark" size={32} color="#FFF" />
              <Text style={styles.sealText}>OFFICIAL</Text>
              <Text style={styles.sealText}>SEAL</Text>
            </View>
          </View>
        </View>

        {/* Verification ID */}
        {data.id && (
          <View style={styles.verificationFooter}>
            <Text style={styles.verificationText}>
              VERIFICATION ID:{" "}
              <Text style={styles.verificationId}>{data.id}</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Main Component
export default function DiplomaGenerator() {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Tablet breakpoint
  const isLandscape = width > height;
  const shouldShowSideBySide = isLargeScreen || isLandscape;

  const [activeTab, setActiveTab] = useState<TabType>("generate");
  const [registry, setRegistry] = useState<CertificateData[]>([]);

  // Generator State
  const [formData, setFormData] = useState<CertificateData>({
    recipientName: "",
    courseName: "",
    date: new Date().toISOString().split("T")[0],
    issuerSignature: "",
    logo: null,
  });
  const [generatedCert, setGeneratedCert] = useState<CertificateData | null>(
    null,
  );

  // Validator State
  const [searchId, setSearchId] = useState("");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (name: keyof CertificateData, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleLogoUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, logo: result.assets[0].uri }));
    }
  };

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null }));
  };

  const handleGenerate = () => {
    if (
      !formData.recipientName ||
      !formData.courseName ||
      !formData.issuerSignature
    ) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    const newId = generateId();
    const newCert: CertificateData = {
      ...formData,
      id: newId,
      timestamp: new Date().toISOString(),
    };

    setRegistry([newCert, ...registry]);
    setGeneratedCert(newCert);
  };

  const handleValidate = () => {
    if (!searchId.trim()) {
      Alert.alert("Missing ID", "Please enter a certificate ID.");
      return;
    }

    setIsVerifying(true);
    setValidationResult(null);

    setTimeout(() => {
      const found = registry.find(
        (c) => c.id === searchId.trim().toUpperCase(),
      );
      setValidationResult(
        found ? { status: "valid", data: found } : { status: "invalid" },
      );
      setIsVerifying(false);
    }, 800);
  };

  const resetGenerator = () => {
    setGeneratedCert(null);
    setFormData({
      recipientName: "",
      courseName: "",
      date: new Date().toISOString().split("T")[0],
      issuerSignature: "",
      logo: null,
    });
  };

  // Form component to avoid duplication
  const renderForm = () => (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <Ionicons name="document-text" size={20} color="#1D4ED8" />
        <Text style={styles.formHeaderText}>Certificate Details</Text>
      </View>

      <View style={styles.formBody}>
        {/* Logo Upload */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Organization Logo</Text>
          <View
            style={[
              styles.logoUploadRow,
              !isLargeScreen && styles.logoUploadColumn,
            ]}
          >
            {formData.logo ? (
              <View style={styles.logoPreview}>
                <Image
                  source={{ uri: formData.logo }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.logoRemoveBtn}
                  onPress={removeLogo}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                !isLargeScreen && styles.uploadBtnFullWidth,
              ]}
              onPress={handleLogoUpload}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#374151" />
              <Text style={styles.uploadBtnText}>Upload Logo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>PNG or JPG recommended</Text>
        </View>

        {/* Recipient Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Recipient Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.recipientName}
            onChangeText={(text) => handleInputChange("recipientName", text)}
            placeholder="e.g. John Doe"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Course Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Course / Event Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.courseName}
            onChangeText={(text) => handleInputChange("courseName", text)}
            placeholder="e.g. Advanced Web Development"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(text) => handleInputChange("date", text)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Signer Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Signer Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.issuerSignature}
            onChangeText={(text) => handleInputChange("issuerSignature", text)}
            placeholder="e.g. Prof. Smith"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Ionicons name="trophy" size={20} color="#FFF" />
          <Text style={styles.generateBtnText}>Issue Certificate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistory = () =>
    registry.length > 0 && (
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>SESSION HISTORY</Text>
        <View style={styles.historyList}>
          {registry.slice(0, 5).map((cert) => (
            <TouchableOpacity
              key={cert.id}
              style={styles.historyItem}
              onPress={() => {
                setGeneratedCert(cert);
                setFormData(cert);
              }}
            >
              <View style={styles.historyItemContent}>
                <Text style={styles.historyItemName} numberOfLines={1}>
                  {cert.recipientName}
                </Text>
                <Text style={styles.historyItemId}>{cert.id}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

  const renderPreview = () =>
    generatedCert ? (
      <View>
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <Text style={styles.successText}>Certificate Generated!</Text>
        </View>

        <TouchableOpacity style={styles.newCertBtn} onPress={resetGenerator}>
          <Ionicons name="refresh" size={18} color="#6B7280" />
          <Text style={styles.newCertBtnText}>New Certificate</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewScroll}
        >
          <Diploma data={generatedCert} />
        </ScrollView>

        <Text style={styles.tipText}>
          Tip: Screenshot or share this certificate with the recipient
        </Text>
      </View>
    ) : (
      <View style={styles.emptyPreview}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>Ready to Generate</Text>
        <Text style={styles.emptyDescription}>
          Fill out the details {shouldShowSideBySide ? "on the left" : "above"}{" "}
          and upload your logo to create a professional certificate.
        </Text>

        <View style={styles.emptyPreviewDiploma}>
          <Diploma
            data={{
              recipientName: formData.recipientName || "Recipient Name",
              courseName: formData.courseName || "Course Title",
              logo: formData.logo,
              date: formData.date,
              issuerSignature: formData.issuerSignature || "Signature",
            }}
            isPreview
          />
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="certificate"
            size={32}
            color="#1D4ED8"
          />
          <Text style={styles.headerTitle}>
            Certify<Text style={styles.headerTitleAccent}>Now</Text>
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "generate" && styles.tabActive]}
            onPress={() => setActiveTab("generate")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "generate" && styles.tabTextActive,
              ]}
            >
              Generator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "validate" && styles.tabActive]}
            onPress={() => setActiveTab("validate")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "validate" && styles.tabTextActive,
              ]}
            >
              Validator
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GENERATOR TAB */}
      {activeTab === "generate" && (
        <View style={styles.generatorContainer}>
          {shouldShowSideBySide ? (
            // Side-by-side layout for large screens/landscape
            <View style={styles.sideBySideContainer}>
              {/* Left Column - Form */}
              <ScrollView
                style={styles.leftColumn}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.leftColumnContent}
              >
                {renderForm()}
                {renderHistory()}
              </ScrollView>

              {/* Right Column - Preview */}
              <View style={styles.rightColumn}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.rightColumnContent}
                >
                  {renderPreview()}
                </ScrollView>
              </View>
            </View>
          ) : (
            // Stacked layout for small screens/portrait
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {renderForm()}
              {renderHistory()}

              {/* Preview Area */}
              <View style={styles.previewCard}>{renderPreview()}</View>
            </ScrollView>
          )}
        </View>
      )}

      {/* VALIDATOR TAB */}
      {activeTab === "validate" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.validatorContainer}>
            <View style={styles.validatorHeader}>
              <Text style={styles.validatorTitle}>Credential Verification</Text>
              <Text style={styles.validatorDescription}>
                Enter the unique Certificate ID found on the diploma to verify
                its authenticity against our (session) registry.
              </Text>
            </View>

            <View style={styles.validatorCard}>
              <View style={styles.searchSection}>
                <View style={styles.searchInputContainer}>
                  <Ionicons
                    name="search"
                    size={24}
                    color="#9CA3AF"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    value={searchId}
                    onChangeText={(text) => setSearchId(text.toUpperCase())}
                    placeholder="ABCD-1234"
                    placeholderTextColor="#D1D5DB"
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.verifyBtn,
                    (!searchId || isVerifying) && styles.verifyBtnDisabled,
                  ]}
                  onPress={handleValidate}
                  disabled={!searchId || isVerifying}
                >
                  <Text style={styles.verifyBtnText}>
                    {isVerifying ? "Verifying..." : "Verify Credential"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Results Area */}
              <View style={styles.resultsArea}>
                {!validationResult && !isVerifying && (
                  <View style={styles.resultsEmpty}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={48}
                      color="#D1D5DB"
                    />
                    <Text style={styles.resultsEmptyText}>
                      Results will appear here
                    </Text>
                  </View>
                )}

                {validationResult?.status === "valid" && (
                  <View style={styles.validResult}>
                    <View style={styles.validHeader}>
                      <View style={styles.validIconContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={32}
                          color="#059669"
                        />
                      </View>
                      <View>
                        <Text style={styles.validTitle}>Valid Certificate</Text>
                        <Text style={styles.validSubtitle}>
                          This credential has been verified in the registry.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.validDetails}>
                      <View style={styles.validDetailRow}>
                        <Text style={styles.validDetailLabel}>Recipient</Text>
                        <Text style={styles.validDetailValue}>
                          {validationResult.data?.recipientName}
                        </Text>
                      </View>

                      <View style={styles.validDetailRow}>
                        <Text style={styles.validDetailLabel}>Course</Text>
                        <Text style={styles.validDetailValue}>
                          {validationResult.data?.courseName}
                        </Text>
                      </View>

                      <View style={styles.validDetailRow}>
                        <Text style={styles.validDetailLabel}>Date Issued</Text>
                        <Text style={styles.validDetailValue}>
                          {formatDate(validationResult.data?.date || "")}
                        </Text>
                      </View>

                      <View style={styles.validDetailRow}>
                        <Text style={styles.validDetailLabel}>Issuer</Text>
                        <Text style={styles.validDetailValueScript}>
                          {validationResult.data?.issuerSignature}
                        </Text>
                      </View>

                      <View
                        style={[styles.validDetailRow, styles.timestampRow]}
                      >
                        <Text style={styles.timestampText}>
                          Timestamp:{" "}
                          {new Date(
                            validationResult.data?.timestamp || "",
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {validationResult?.status === "invalid" && (
                  <View style={styles.invalidResult}>
                    <Ionicons name="close-circle" size={64} color="#EF4444" />
                    <Text style={styles.invalidTitle}>Invalid Certificate</Text>
                    <Text style={styles.invalidDescription}>
                      We could not find a certificate with ID{" "}
                      <Text style={styles.invalidId}>{searchId}</Text> in the
                      registry.
                    </Text>
                    <Text style={styles.invalidSubtext}>
                      Please check the ID and try again.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  headerTitleAccent: {
    color: "#1D4ED8",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#1D4ED8",
  },

  // Layout Styles
  generatorContainer: {
    flex: 1,
  },
  sideBySideContainer: {
    flex: 1,
    flexDirection: "row",
  },
  leftColumn: {
    flex: 1,
    maxWidth: 400,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  leftColumnContent: {
    padding: 16,
  },
  rightColumn: {
    flex: 2,
    backgroundColor: "#F9FAFB",
  },
  rightColumnContent: {
    padding: 16,
  },
  content: {
    flex: 1,
  },

  // Form Styles
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  formHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  formBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  logoUploadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoUploadColumn: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginRight: 16,
    position: "relative",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  uploadBtnFullWidth: {
    marginRight: 0,
    marginTop: 12,
    justifyContent: "center",
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  // History Styles
  historyCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 12,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  historyItemId: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#6B7280",
  },

  // Preview Styles
  previewCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#047857",
    marginLeft: 8,
  },
  newCertBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 16,
  },
  newCertBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 6,
  },
  previewScroll: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  },
  emptyPreview: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
  },
  emptyIconContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    padding: 16,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 300,
    marginBottom: 24,
  },
  emptyPreviewDiploma: {
    opacity: 0.5,
  },

  // Diploma Styles
  diplomaContainer: {
    width: 794,
    height: 1123,
    backgroundColor: "#FDFBF7",
    padding: 40,
    position: "relative",
  },
  borderOuter: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 4,
    borderColor: "#1F2937",
  },
  borderInner: {
    position: "absolute",
    top: 32,
    left: 32,
    right: 32,
    bottom: 32,
    borderWidth: 1,
    borderColor: "#9CA3AF",
  },
  cornerOrnament: {
    position: "absolute",
    width: 96,
    height: 96,
  },
  cornerTopLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#1F2937",
  },
  cornerTopRight: {
    top: 20,
    right: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#1F2937",
  },
  cornerBottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#1F2937",
  },
  cornerBottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#1F2937",
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 48,
    paddingHorizontal: 32,
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginTop: 32,
  },
  logoContainer: {
    height: 128,
    width: 192,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logo: {
    maxHeight: "100%",
    maxWidth: "100%",
  },
  titleText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 8,
    marginTop: 24,
  },
  subtitleText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 20,
    fontWeight: "400",
    color: "#111827",
    letterSpacing: 4,
    marginTop: 4,
  },
  divider: {
    width: 64,
    height: 4,
    backgroundColor: "#D4AF37",
    borderRadius: 2,
    marginTop: 16,
  },
  middleSection: {
    alignItems: "center",
    width: "100%",
  },
  presentedToText: {
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    fontSize: 20,
    color: "#6B7280",
    letterSpacing: 3,
    marginBottom: 16,
  },
  recipientContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  recipientName: {
    fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
    fontSize: 56,
    fontWeight: "400",
    color: "#1E3A8A",
    textAlign: "center",
  },
  underline: {
    width: "60%",
    height: 1,
    backgroundColor: "#D1D5DB",
    marginTop: 8,
  },
  completionText: {
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  courseTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    maxWidth: "90%",
  },
  bottomSection: {
    width: "100%",
    marginTop: "auto",
    marginBottom: 48,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 48,
  },
  signatureBlock: {
    alignItems: "center",
    minWidth: 200,
  },
  signatureText: {
    fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
    fontSize: 32,
    color: "#1F2937",
    marginBottom: 8,
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: "#9CA3AF",
    marginBottom: 12,
  },
  signatureLabel: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 2,
  },
  sealContainer: {
    alignItems: "center",
  },
  seal: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sealText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  verificationFooter: {
    alignItems: "center",
    marginTop: 32,
  },
  verificationText: {
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    fontSize: 10,
    color: "#9CA3AF",
    letterSpacing: 2,
  },
  verificationId: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#4B5563",
    fontWeight: "700",
  },

  // Validator Styles
  validatorContainer: {
    padding: 16,
  },
  validatorHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  validatorTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  validatorDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 400,
  },
  validatorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputContainer: {
    position: "relative",
    marginBottom: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#111827",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  verifyBtn: {
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  verifyBtnDisabled: {
    backgroundColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resultsArea: {
    padding: 24,
    backgroundColor: "#F9FAFB",
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsEmpty: {
    alignItems: "center",
  },
  resultsEmptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  validResult: {
    width: "100%",
  },
  validHeader: {
    flexDirection: "row",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  validIconContainer: {
    backgroundColor: "#D1FAE5",
    borderRadius: 24,
    padding: 8,
    marginRight: 16,
  },
  validTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  validSubtitle: {
    fontSize: 14,
    color: "#059669",
  },
  validDetails: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
  },
  validDetailRow: {
    marginBottom: 16,
  },
  validDetailLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  validDetailValue: {
    fontSize: 18,
    fontWeight: "500",
    color: "#111827",
  },
  validDetailValueScript: {
    fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
    fontSize: 24,
    color: "#374151",
  },
  timestampRow: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 0,
  },
  timestampText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  invalidResult: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 24,
    width: "100%",
  },
  invalidTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#B91C1C",
    marginTop: 16,
    marginBottom: 8,
  },
  invalidDescription: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 8,
  },
  invalidId: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "700",
  },
  invalidSubtext: {
    fontSize: 14,
    color: "#EF4444",
    marginTop: 8,
  },
});
